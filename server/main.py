from threading import Thread
from threading import Lock
import commands
import urllib2
import json
import time
import sys
import os

STREAMS = [
'http://abclive.abcnews.com/i/abc_live1@136327/index_1800_av-p.m3u8?sd=10&rebase=on',
#'http://abclive.abcnews.com/i/abc_live1@136327/index_1800_av-b.m3u8?sd=10&rebase=on',
'http://abclive.abcnews.com/i/abc_live2@136328/index_1800_av-p.m3u8?sd=10&rebase=on',
#'http://abclive.abcnews.com/i/abc_live2@136328/index_1800_av-b.m3u8?sd=10&rebase=on',
'http://abclive.abcnews.com/i/abc_live3@136329/index_1800_av-p.m3u8?sd=10&rebase=on',
#'http://abclive.abcnews.com/i/abc_live3@136329/index_1800_av-b.m3u8?sd=10&rebase=on',
'http://abclive.abcnews.com/i/abc_live4@136330/index_1800_av-p.m3u8?sd=10&rebase=on',
#'http://abclive.abcnews.com/i/abc_live4@136330/index_1800_av-b.m3u8?sd=10&rebase=on',
'http://abclive.abcnews.com/i/abc_live4@97035/index_1800_av-p.m3u8?sd=10&rebase=on',
#'http://abclive.abcnews.com/i/abc_live4@97035/index_1800_av-b.m3u8?sd=10&rebase=on',
]
FRAME_RATE = 29.97
ORIGINAL_WIDTH = 960
ORIGINAL_HEIGHT = 540
SCALE_FACTOR = 3
SEGMENT_DURATION = 10.01
DVR_WINDOW_SIZE = 60
KEEP_WINDOW_DURATION = 60
DURATION_CORRECTION_THRESHOLD = 1000        # millis

POLLING_INTERVAL = SEGMENT_DURATION / 3
OUTPUT_FOLDER = os.path.dirname(__file__)
if len(OUTPUT_FOLDER) == 0:
    OUTPUT_FOLDER = os.getcwd()

STRIP_GEN_INTERVAL = SEGMENT_DURATION
STREAM_COUNT = len(STREAMS)
FFMPEG_BIN = '/web/content/shared/bin/ffmpeg-2.7.2-bin/ffmpeg.sh'
FFPROBE_BIN = '/web/content/shared/bin/ffmpeg-2.7.2-bin/ffprobe.sh'
LIBX264_PARAMS = "-c:v libx264 -x264opts stitchable -subq 2 -qcomp 0.6 -qmin 10 -qmax 50 -qdiff 4 -coder 0 -vprofile main -level 3.1 -b:v 1100k -refs 2 -keyint_min 1 -g 60 -force_key_frames expr:'gte(t,n_forced*2)' -pix_fmt yuv420p -r %s" % FRAME_RATE
NO_STREAM_VIDEO_FILENAME = 'no_stream_vid.mp4'
NO_STREAM_VIDEO = os.path.join(OUTPUT_FOLDER, NO_STREAM_VIDEO_FILENAME)
NO_STREAM_AUDIO_FILENAME = 'no_stream_aud.mp4'
NO_STREAM_AUDIO = os.path.join(OUTPUT_FOLDER, NO_STREAM_AUDIO_FILENAME)
NO_STREAM_VIDEO_TS = os.path.join(OUTPUT_FOLDER, 'no_stream_vid.ts')
NO_STREAM_AUDIO_TS = os.path.join(OUTPUT_FOLDER, 'no_stream_aud.ts')

SCALED_WIDTH = ORIGINAL_WIDTH / SCALE_FACTOR
SCALED_HEIGHT = ORIGINAL_HEIGHT / SCALE_FACTOR

lastFileLock = Lock()
lastVideoFiles = {}
lastAudioFiles = {}

segmentBaseTime = (int(time.time()) + DVR_WINDOW_SIZE) * 1000

outputLock = Lock()

def writeOutput(msg, index = ''):
    outputLock.acquire()
    sys.stdout.write('[%s] %s %s\n' % (index, time.strftime('%Y-%m-%d %H:%M:%S'), msg))
    sys.stdout.flush()
    outputLock.release()

'''
# cannot generate a no stream video ourselves since the h264 will not be identical to the original stream

NO_STREAM_IMAGE = 'no_stream.jpg'

def generateNoStreamVideo():
    cmdLine = ' '.join([
        FFMPEG_BIN,
        '-loop 1',
        '-i %s' % NO_STREAM_IMAGE,
        '-vf scale=%s:%s' % (ORIGINAL_WIDTH, ORIGINAL_HEIGHT),
        LIBX264_PARAMS,
        '-t %s' % (SEGMENT_DURATION * 2),       # using longer segment, doesn't matter since we take shortest when merging
        '-y %s' % NO_STREAM_VIDEO,
        '2>&1'
        ])
    print cmdLine
    commands.getoutput(cmdLine)

generateNoStreamVideo()
'''

def getDuration(filePath, index, streamType = None):
    selectStreams = ''
    if streamType != None:
        selectStreams = '-select_streams %s' % streamType
        
    cmdLine = ' '.join([
        FFPROBE_BIN,
        '-i %s' % filePath,
        selectStreams,
        '-show_streams -v quiet -print_format json',
        '2>&1'])
    writeOutput('Info: Running %s' % cmdLine, index)
    status, ffprobeJson = commands.getstatusoutput(cmdLine)
    if status != 0:
        writeOutput('Warning: ffprobe returned %s log %s' % (status, ffprobeJson), index)
        return 0
    ffprobeObj = json.loads(ffprobeJson)
    try:
        duration = ffprobeObj["streams"][0]["duration"]
    except KeyError:
        writeOutput('Error: failed to get the duration %s' % ffprobeJson, index)
        return 0
    duration = int(float(duration) * 1000)
    writeOutput('Info: Duration of %s is %s' % (filePath, duration), index)    
    return duration

class WorkerThread(Thread):
    def __init__(self, id):
        Thread.__init__(self)
        self.id = id
        self.msgId = 'T%s' % self.id
        self.outputFolder = os.path.join(OUTPUT_FOLDER, 'hack-%s' % self.id)
        try:
            os.mkdir(self.outputFolder)
        except OSError:
            pass

    def writeOutput(self, msg):
        writeOutput(msg, self.msgId)

    def getURL(self, url):
        self.writeOutput('Info: Getting %s' % url)
        startTime = time.time()
        request = urllib2.Request(url)
        try:
            f = urllib2.urlopen(request)
            data = f.read()
            self.writeOutput('Info: Done, downloaded %s bytes in %s sec' % (len(data), time.time() - startTime))
            return f.getcode(), data
        except urllib2.HTTPError, e:
            return e.getcode(), e.read()
        except urllib2.URLError, e:
            self.writeOutput('Error: request failed %s %s' % (url, e))
            return 0, ''
        except BadStatusLine, e:
            self.writeOutput('Error: request failed %s %s' % (url, e))
            return 0, ''
        except socket.error, e:
            self.writeOutput('Error: got socket error %s %s' % (url, e))
            return 0, ''

    def getUrlsFromM3U8(self, content):
        if not content.startswith('#EXTM3U'):
            return []
        result = []
        for curLine in content.split('\n'):
            curLine = curLine.strip()
            if len(curLine) == 0 or curLine.startswith('#'):
                continue
            result.append(curLine)
        return result

    def run(self):
        self.writeOutput('Info: Started')
        fileIndex = 1
        lastDownloaded = None
        firstTime = True
        while True:
            if not firstTime:
                time.sleep(POLLING_INTERVAL)
            firstTime = False

            # get the manifest
            code, m3u8 = self.getURL(STREAMS[self.id])
            if code != 200:
                continue

            # get the last ts url
            tsUrls = self.getUrlsFromM3U8(m3u8)
            if len(tsUrls) == 0:
                continue
            curTsUrl = tsUrls[-1]
            if lastDownloaded == curTsUrl:
                continue

            # download the ts file
            code, tsData = self.getURL(curTsUrl)
            if code != 200:
                continue

            tsFilePath = os.path.join(self.outputFolder, '%s.ts' % fileIndex)
            file(tsFilePath, 'wb').write(tsData)

            videoDuration = getDuration(tsFilePath, self.msgId, 'v')
            audioDuration = getDuration(tsFilePath, self.msgId, 'a')

            # extract the video to mp4
            videoFilePath = os.path.join(self.outputFolder, 'v%s.mp4' % fileIndex)

            inputFile = tsFilePath
            durationParam = ''
            if abs(videoDuration - SEGMENT_DURATION * 1000) > DURATION_CORRECTION_THRESHOLD:
                self.writeOutput('Warning: invalid video duration %s applying correction' % videoDuration)
                inputFile = "'concat:%s|%s'" % (tsFilePath, NO_STREAM_VIDEO_TS)
                durationParam = '-t %s' % SEGMENT_DURATION

            cmdLine = ' '.join([
                FFMPEG_BIN,
                '-i %s' % inputFile,
                '-vcodec copy -an -f mp4',
                durationParam,
                '-y %s' % videoFilePath,
                '2>&1'])
            self.writeOutput('Info: Running %s' % cmdLine)
            status, output = commands.getstatusoutput(cmdLine)
            if status != 0:
                self.writeOutput('Error: ffmpeg failed %s log %s' % (status, output))
            videoDuration = getDuration(videoFilePath, self.msgId)

            # extract the audio to mp4
            audioFilePath = os.path.join(self.outputFolder, 'a%s.mp4' % fileIndex)

            inputFile = tsFilePath
            durationParam = ''
            tempAudioFilePath = None
            if abs(audioDuration - SEGMENT_DURATION * 1000) > DURATION_CORRECTION_THRESHOLD:
                self.writeOutput('Warning: invalid audio duration %s applying correction' % audioDuration)

                tempAudioFilePath = os.path.join(self.outputFolder, '%s-aud.ts' % fileIndex)
                cmdLine = ' '.join([
                    FFMPEG_BIN,
                    '-i %s' % inputFile,
                    '-vn -acodec copy -f mpegts',
                    '-y %s' % tempAudioFilePath,
                    '2>&1'])
                self.writeOutput('Info: Running %s' % cmdLine)
                status, output = commands.getstatusoutput(cmdLine)
                if status != 0:
                    self.writeOutput('Error: ffmpeg failed %s log %s' % (status, output))

                inputFile = "'concat:%s|%s'" % (tempAudioFilePath, NO_STREAM_AUDIO_TS)
                durationParam = '-t %s' % SEGMENT_DURATION

            cmdLine = ' '.join([
                FFMPEG_BIN,
                '-i %s' % inputFile,
                '-vn -acodec copy -bsf:a aac_adtstoasc -f mp4',
                durationParam,
                '-y %s' % audioFilePath,
                '2>&1'])
            self.writeOutput('Info: Running %s' % cmdLine)
            status, output = commands.getstatusoutput(cmdLine)
            if status != 0:
                self.writeOutput('Error: ffmpeg failed %s log %s' % (status, output))
            audioDuration = getDuration(audioFilePath, self.msgId)

            # remove the ts file
            os.remove(tsFilePath)
            if tempAudioFilePath != None:
                os.remove(tempAudioFilePath)

            # add to the array
            lastFileLock.acquire()
            lastVideoFiles[self.id] = {
                'path': videoFilePath,
                'duration': videoDuration,
            }
            lastAudioFiles[self.id] = {
                'path': audioFilePath,
                'duration': audioDuration,
            }
            lastFileLock.release()

            lastDownloaded = curTsUrl

            fileIndex += 1

class StripGenThread(Thread):
    def __init__(self):
        Thread.__init__(self)
        self.outputFolder = os.path.join(OUTPUT_FOLDER, 'hack-strip')
        try:
            os.mkdir(self.outputFolder)
        except OSError:
            pass

    def writeOutput(self, msg):
        writeOutput(msg, 'TStrip')

    @staticmethod
    def getSourceObject(path):
        return {"type": "source", "path": path}

    def addToSequence(self, sequences, key, path, duration):
        sequences.setdefault(key, [])
        
        # get the timestamp
        if len(sequences[key]) > 0:
            timestamp = sequences[key][-1]['timestamp'] + sequences[key][-1]['duration']
        else:
            timestamp = segmentBaseTime

        # add the clip
        self.writeOutput('Info: Adding %s to sequence %s' % (path, key))
        sequences[key].append({
            'path': path,
            'duration': duration,
            'timestamp': timestamp,
            })

        # remove old clips
        while sequences[key][0]['timestamp'] < (time.time() - KEEP_WINDOW_DURATION) * 1000:
            filePath = sequences[key][0]['path']
            if not NO_STREAM_VIDEO_FILENAME in filePath and \
               not NO_STREAM_AUDIO_FILENAME in filePath:
                self.writeOutput('Info: Deleting %s' % filePath)
                os.remove(filePath)
            sequences[key] = sequences[key][1:]

    def run(self):
        global lastVideoFiles, lastAudioFiles

        self.writeOutput('Info: Started')
        sequences = {}
        fileIndex = 1
        startTime = time.time()
        
        while True:            
            # get the last files
            lastFileLock.acquire()
            curVideoFiles = lastVideoFiles
            curAudioFiles = lastAudioFiles
            lastVideoFiles = {}
            lastAudioFiles = {}
            lastFileLock.release()

            # make sure we have a segment for each channel (fill with NO_STREAM_VIDEO as needed)
            if len(curVideoFiles) > 0:
                minVideoDuration = min(map(lambda x: x['duration'], curVideoFiles.values()))
            else:
                minVideoDuration = int(SEGMENT_DURATION * 1000)

            if len(curAudioFiles) > 0:
                minAudioDuration = min(map(lambda x: x['duration'], curAudioFiles.values()))
            else:
                minAudioDuration = int(SEGMENT_DURATION * 1000)

            videoPaths = []
            for id in xrange(STREAM_COUNT):
                if not curVideoFiles.has_key(id):
                    self.writeOutput('Warning: Missing video for id %s, using filler' % id)
                    curVideoFiles[id] = {
                        'path': NO_STREAM_VIDEO,
                        'duration': minVideoDuration,
                    }
                videoPaths.append(curVideoFiles[id]['path'])
                
                if not curAudioFiles.has_key(id):
                    self.writeOutput('Warning: Missing audio for id %s, using filler' % id)
                    curAudioFiles[id] = {
                        'path': NO_STREAM_AUDIO,
                        'duration': minAudioDuration,
                    }

            outputFile = os.path.join(self.outputFolder, '%s.mp4' % fileIndex)

            # generate the strip with ffmpeg
            inputFilesStr = ' '.join(map(lambda x: '-i %s' % x, videoPaths))
            
            filterComplex = '-filter_complex "nullsrc=size=%sx%s [base]; ' % (SCALED_WIDTH * STREAM_COUNT, SCALED_HEIGHT)
            for curIndex in xrange(STREAM_COUNT):
                filterComplex += '[%s:v] setpts=PTS-STARTPTS, scale=%sx%s [vid%s]; ' % (curIndex, SCALED_WIDTH, SCALED_HEIGHT, curIndex)
            curSrc = 'base'
            for curIndex in xrange(STREAM_COUNT):
                filterComplex += '[%s][vid%s] overlay=shortest=1:x=%s' % (curSrc, curIndex, curIndex * SCALED_WIDTH)
                if curIndex + 1 < STREAM_COUNT:
                    filterComplex += ' [tmp%s]; ' % (curIndex)
                curSrc = 'tmp%s' % curIndex
            filterComplex += '"'

            noAudio = '-an'

            outputFileParam = '-y %s' % outputFile

            cmdLine = ' '.join([
                FFMPEG_BIN,
                inputFilesStr,
                filterComplex,
                LIBX264_PARAMS,
                noAudio,
                outputFileParam,
                '2>&1'])
            self.writeOutput('Info: Running %s' % cmdLine)
            status, output = commands.getstatusoutput(cmdLine)
            if status != 0:
                self.writeOutput('Error: ffmpeg failed %s log %s' % (status, output))

            videoDuration = getDuration(outputFile, 'TStrip')

            # add a segment to each sequence
            self.addToSequence(sequences, 'strip', outputFile, videoDuration)                
            for id in xrange(STREAM_COUNT):
                self.addToSequence(sequences, 'vid-%s' % id, curVideoFiles[id]['path'], curVideoFiles[id]['duration'])
                self.addToSequence(sequences, 'aud-%s' % id, curAudioFiles[id]['path'], curAudioFiles[id]['duration'])

            # save the json
            for key, sequence in sequences.items():
                jsonObject = {
                    "discontinuity": False,
                    "playlistType": "live",
                    "segmentBaseTime": segmentBaseTime,
                    "firstClipTime": sequence[0]['timestamp'],
                    "durations": map(lambda x: x['duration'], sequence),
                    "sequences":[{
                        "clips":map(lambda x: StripGenThread.getSourceObject(x['path']), sequence)
                        }]
                    }
                outputFile = os.path.join(OUTPUT_FOLDER, '%s.json' % key)
                json.dump(jsonObject, file(outputFile, 'w'))

            fileIndex += 1

            # wait until the end of the cycle
            startTime += STRIP_GEN_INTERVAL
            endTime = time.time()
            if endTime < startTime:
                time.sleep(startTime - endTime)

# start the worker threads
threads = []
for id in xrange(STREAM_COUNT):
    curThread = WorkerThread(id)
    curThread.start()
    threads.append(curThread)

curThread = StripGenThread()
curThread.start()
threads.append(curThread)

writeOutput('Info: Started', 'Main')

while True:
    time.sleep(10)
