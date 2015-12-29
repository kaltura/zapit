include nginx.conf.global;

http {
	upstream kalapi {
		server ny-www.kaltura.com;
	}
	
	upstream thumbcache {
		server ny-thumbcachevip:8080;
	}

	upstream fallback {
		server pa-kalhls.origin.kaltura.com;
	}
	
	upstream udrm {
		server ny-udrm:8080;
	}
	
	include nginx.conf.http;
}
