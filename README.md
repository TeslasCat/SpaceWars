# Space Wars ☢

## Run

	cd client
	python -m SimpleHTTPServer 8001 & 
	cd ../server
	node index.js

## Docker 

	docker build -t spacewars .
	docker run -it -p 8000:8000 --rm --name space spacewars

## Vagrant

Install vagrant with libvirt support. Or change the base image to another provider, but keep it Debian based. 

	vagrant up
	vagrant ssh
	$ cd /vagrant
	$ npm start

From the host you should be able to access http://127.0.0.1
