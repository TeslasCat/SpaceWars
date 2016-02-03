# Space Wars ☢

## Manual Install

Check the ```instal.sh``` file and use the configuration files located in the config folder.

## Vagrant

Install vagrant with libvirt support. Or change the base image to another provider, but keep it Debian based. 

	vagrant up
	vagrant ssh
	$ cd /vagrant/server
	$ node index.js 2> stderr.log

From the host you should be able to access <http://127.0.0.1:8000>

## [Old] Docker

Current docker config is old and does not work.

	docker build -t spacewars .
	docker run -it -p 8000:8000 --rm --name space spacewars