#!/bin/bash
set -e


function create_key {
    blockstack make_keychain -t > new_keychain.txt
    value=$(<new_keychain.txt)
    address=$(grep -Po '"address":.*?[^\\]",' new_keychain.txt)
    mkdir -p ~/.bstack-cli
    mv ./new_keychain.txt  ~/.bstack-cli/keychain.txt
    echo "New address created for you :("
    echo "$address"
}

function get_stx_test_tokens {
    address=$(grep -Po '"address":.*?[^\\]",' ~/.bstack-cli/keychain.txt)
    IFS=':'
    read -a addr_keyval_arr <<< "$address"
    IFS='"'
    read -a address_trim_arr <<< "${addr_keyval_arr[1]}"
    echo "Getting tokens for addresss: ${address_trim_arr[1]}"
    url="https://sidecar.staging.blockstack.xyz/sidecar/v1/faucets/stx?address=${address_trim_arr[1]}" 
    curl -XPOST "$url" | json_pp

}

function call_contract_func {
    contract="$1"
    function_name="$2"
    payment="$3"
    block_number="$4"
    privateKey=$(grep -Po '"privateKey":.*?[^\\]",' ~/.bstack-cli/keychain.txt)
    IFS=':'
    read -a privateKey_keyval_arr <<< "$privateKey"
    IFS='"'
    read -a privateKey_trim_arr <<< "${privateKey_keyval_arr[1]}"

    address=$(grep -Po '"address":.*?[^\\]",' ~/.bstack-cli/keychain.txt)
    IFS=':'
    read -a addr_keyval_arr <<< "$address"
    IFS='"'
    read -a address_trim_arr <<< "${addr_keyval_arr[1]}"

    blockstack call_contract_func "${address_trim_arr[1]}" "$contract" "$function_name" "$payment" "$block_number" "${privateKey_trim_arr[1]}" -t

}

function deploy_contract {
    privateKey=$(grep -Po '"privateKey":.*?[^\\]",' ~/.bstack-cli/keychain.txt)
    IFS=':'
    read -a privateKey_keyval_arr <<< "$privateKey"
    IFS='"'
    read -a privateKey_trim_arr <<< "${privateKey_keyval_arr[1]}"
    filename="./$1/contracts/$1.clar"
    blockstack deploy_contract "$filename" "$1" 20 0 "${privateKey_trim_arr[1]}" -t

    address=$(grep -Po '"address":.*?[^\\]",' ~/.bstack-cli/keychain.txt)
    IFS=':'
    read -a addr_keyval_arr <<< "$address"
    IFS='"'
    read -a address_trim_arr <<< "${addr_keyval_arr[1]}"

}

function create_project_skeleton {
    project_name="$1"
    hello_world="hello world"
    func_start="$project_name-say-hi"
    mkdir -p "$project_name/contracts"
    touch "$project_name/contracts/$project_name.clar"
    fileName="$project_name/contracts/$project_name.clar"
    echo "(define-public ($func_start)" >> "$fileName"
    echo "  (ok \""$hello_world"\"))" >> "$fileName"
    echo  >> "$fileName"
    echo "(define-read-only (echo-number (val int))" >> "$fileName"
    echo "  (ok val))" >> "$fileName"
    mkdir -p "$project_name/deploy"
    mkdir -p "$project_name/tests"
    touch "$project_name/tests/$project_name.js"
    
}

function drop {
    rm -rf "$1"
}

function help {
    echo
    echo "  :=)This is a basic tool to help you out while learning blockstack with testnet(=:"
    echo
    echo "  Create new project"
    echo "  Command: bstack-cli new <project-name>"
    echo "  Change project-name and the angles surrounding it with your project name"
    echo
    echo "  To create key"
    echo "  Command: bstack-cli create_key"
    echo "  This would create public and private keys"
    echo
    echo "  Get tokens for your address"
    echo "  Command: bstack-cli get_stx_test_tokens"
    echo "  You need tokens to deploy and play with testnet"
    echo
    echo "  Deploy contract"
    echo "  Command: bstack-cli deploy_contract <project-name>"
    echo
    echo "  Delete your project"
    echo "  Command: bstack-cli drop <project-name>"
    echo "  Change project-name and the angles surrounding it with your project name"
    echo
    echo "  Calling contract function"
    echo "  You are missing arguments"
    echo "  Command: bstack-cli contract_func contact_name contract_func gas(amount to used to tx) block_number"
}


if [ "$1" == "new" ]; then
    if [ -z "$2" ]; then
        echo "  Project name missing. Use the below to correct it"
        echo "  Command: bstack-cli new <project-name>"
        echo "  Change project-name and the angles surrounding it with your project name"
    else
        create_project_skeleton $2
    fi   
elif [ "$1" == "create_key" ]; then
    create_key
elif [ "$1" == "get_stx_test_tokens" ]; then
    file=~/.bstack-cli/keychain.txt
    if [ -f $file ]; then
        get_stx_test_tokens
    else 
        echo "  Create key file first"
        echo "  Command: bstack-cli create_key"
        echo "  This would create public and private keys"
    fi
elif [ "$1" == "deploy_contract" ]; then
    echo "$2"
    if [ -z "$2" ]; then
        echo "  Follow the below instruction to solve this issue"
        echo "  Deploy contract"
        echo "  Command: bstack-cli deploy_contract <project-name>"
    else
       file=~/.bstack-cli/keychain.txt
       if [ -f $file ]; then
            deploy_contract $2 $2
        else 
            echo "Create key file first"
            echo "  Command: bstack-cli create_key"
            echo "  This would create public and private keys"
        fi
    fi
elif [ "$1" == "call_contract_func" ]; then
    if [ -z "$2" && -z "$3" && -z "$4" && -z "$5"]; then
        echo "You are missing arguments"
        echo "Command: bstack-cli contract_func contact_name contract_func gas(amount to used to tx) block_number"
    else
        call_contract_func $2 $3 $4 $5
    fi
elif [ "$1" == "drop" ]; then
    if [ -z "$2" ]; then   
        echo "  No project name"
        echo "  Command: bstack-cli drop <project-name>"
        echo "  Change project-name and the angles surrounding it with your project name"
    else
        drop $2
    fi
else
    help
fi
