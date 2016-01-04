# Space Wars ☢

## Run

	cd client
	python -m SimpleHTTPServer 8001 & 
	cd ../server
	node index.js

## Docker 

	docker build -t spacewars .
	docker run -it -p 8000:8000 --rm --name space spacewars
