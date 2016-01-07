# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "naelyn/ubuntu-trusty64-libvirt"

  config.vm.network "forwarded_port", guest: 8001, host: 8001
  config.vm.network "forwarded_port", guest: 8000, host: 8000

  # config.vm.synced_folder "../data", "/vagrant_data"

  config.vm.provision "shell", path: "install.sh"
end
