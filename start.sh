cd client
python -m SimpleHTTPServer 8001 & 
cd ../server
node index.js
echo "http://localhost:8001"
