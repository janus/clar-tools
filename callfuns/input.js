

const readline = require("readline");
const procss = require("process");
const run = require('./runjs.js');


const tokens = run.tokenizeInsideOfFolder(procss.argv[procss.argv.length - 1]);
/*
let stdin = process.openStdin();
console.log(">>")
stdin.addListener("data", function(d){
    console.log("you entered: [" + d.toString().trim() + "]\n>>");
})
*/
//let dd = run.tokenizeInsideOfFolder()

let helpGuide = function(){
    let msg = `
    \n\n\tInstruction guide\n
    \tThis works only for contract public facing functions. 
    \n\tCommand: signature <function-name>
    \tTo get signature of a particular function named <function-name>
    \n\tCommand: signatures
    \tTo get all functions that one could call externally from a contract
    \n\tCommand: help
    `
    console.log('\x1b[1m', msg);
};

let rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('clar>> ');
rl.prompt();
rl.on('line', function(line) {
    if(line === "exit") rl.close();
    let text = line.trim();
    if(text.startsWith("signature")) {
        let arr = text.split(' ');
        let rtnArray = arr.filter(function(element){
            if(element !== ' '){
                return element;
            }
        })
        if(rtnArray.length === 2) {
            run.getFunctionSignature(rtnArray[1], tokens);
        } else {
            run.getFunctionsSignature(tokens);
        }
    } else if(text === "signatures") {
        run.getFunctionsSignature(tokens);
    } else {
        helpGuide();

    }
    rl.prompt();

}).on('close', function(){
    console.log("\nBYE BYE FROM CLAR =(:")
    process.exit(0);
});