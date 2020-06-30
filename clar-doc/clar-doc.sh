#!/bin/bash
set -e

if [ -z "$1" ]; then   
    echo "  Your input should be either file or Directory "
    echo "  This generator work with only Clarity Contract Language"
elif [ "$1" == "help" ]; then
  
    echo "  Clarity Contract Language Document generator for only public functions"
    echo "  Command: clar-doc.sh <folder-or-file>"
    echo "  Make sure that your folder contain Clarity files and that your file is Clarity file"
    echo "  Make clar-doc.sh an executable by: chmod +x ./clar-doc.sh"
    echo "  Only tested on Ubuntu with Chrome browser"
else
    node presentation.js $1
fi