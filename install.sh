# Install basics
sudo apt-get update
sudo apt-get install -y nodejs npm nginx git htop # htop and git are optional.
sudo ln -s $(which nodejs) /usr/bin/node

cd /vagrant
npm install 

cd /home/vagrant

wget https://github.com/antirez/redis/archive/3.2.0-rc3.tar.gz
tar xzf 3.2.0-rc3.tar.gz
cd redis-3.2.0-rc3
make

# TODO: Check build worked.

# Setup auto start.
sudo cp src/redis-server /usr/local/bin
sudo cp src/redis-cli /usr/local/bin

sudo mkdir /etc/redis
sudo mkdir /var/redis
sudo mkdir /var/redis/6370

cd /vagrant

sudo cp config/redis/init_script /etc/init.d/redis_6370
sudo cp config/redis/redis.conf /etc/redis/6370.conf # This is configured for development not production.

sudo update-rc.d redis_6370 defaults

/etc/init.d/redis_6370 start

# www
sudo mv /vagrant/config/nginx/sites-enabled/spacewars /etc/nginx/sites-enabled/default
sudo service nginx restart

