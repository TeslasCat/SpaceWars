# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "naelyn/ubuntu-trusty64-libvirt"

  config.vm.network "forwarded_port", guest: 80, host: 8000, auto_correct: true
  config.vm.network "forwarded_port", guest: 6370, host: 6379, auto_correct: true
  # config.vm.synced_folder "../data", "/vagrant_data"

  config.vm.provision "file", source: "~/.gitconfig", destination: ".gitconfig"
  config.vm.provision "shell", path: "install.sh"
end
