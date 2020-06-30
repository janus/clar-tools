var fs = require('fs');

const CLARTPYES = ["int", "uint", "principal", "bool", "tuple", "list"];

var getContractFolder = function(npath) {
    
    const EXTENSIONLENGTH = 4;
    let path = npath || "./";
    let arrOfdirs = path.split('/');
    if(arrOfdirs[arrOfdirs.length - 1] === "contracts") {
        path = path.endsWith('/')? path.substr(0, path.length - 1): path;
        return path;
    }

    let files = fs.readdirSync(path);   


    let len = files.length;
    let  isDirExist;
    for(let i = 0; i < len; i++){
        if(files[i].length > EXTENSIONLENGTH && files[i].endsWith(".clar")){
            path = path.substr(-1) === '/'? path.substr(0, path.length - 1): path;
            return path;
        }

        let newPath = path === "./"? path+files[i]:path.substr(-1) === '/'?path+files[i] :path+"/"+files[i];

        isDirExist = fs.existsSync(newPath) && fs.lstatSync(newPath).isDirectory();
        if(isDirExist) {
            let targetPath = getContractFolder(newPath);
            if(targetPath !== undefined) {
                return targetPath;
            }

        }

    }
};

const SYMBOL = 1;
const LEFTPREN = 2;
const RIGHTPREN = 3;
const OTHERS = 4;
const SYMBOLSTATE = 1
const STARTSTATE = 0;
const OTHERSTATE = 2;

let tokenize = function(source) {   
    let len = source.length;
    let i = 0;
    let rtnArray = [];
    if(len === 0) {
        return rtnArray;
    }
    let accum = '';

    let state = 0;
    while(i < len){
        if(state === STARTSTATE) {
            if(source[i] === ')') {
                rtnArray.push([RIGHTPREN, ')']);
            } else if(source[i] === '(') {
                rtnArray.push([LEFTPREN,'(']);
            } else if(source[i] >= 'a' && source[i] <= 'z') {
                accum = source[i];
                state = SYMBOLSTATE;
            } else if(source[i] !== ' ') {
                state = OTHERSTATE;
            }
            i++;      
        } else if(state === SYMBOLSTATE) {
            if(source[i] >= 'a' && source[i] <= 'z' ||  ['-', '!'].includes(source[i])) {
                accum += source[i];
                state = SYMBOLSTATE;
                i++;
            } else {
                rtnArray.push([SYMBOL, accum]);
                state = STARTSTATE;
            }

        } else if(state === OTHERSTATE) {
            if(!['"', ')', '('].includes(source[i])) {
                i++;
            } else {
                state = STARTSTATE;
            }
        }

    }
    return rtnArray;
};

let tokenizeInsideOfFolder = function(path) {
    try {
        let targetPath = getContractFolder(path);
        let files = fs.readdirSync(targetPath);
        let len = files.length;
        
        let rtnArray = [];
        for(let i = 0; i < len; i++){
            if(files[i].substr(-5) === ".clar") {
                let source = fs.readFileSync(targetPath+"/"+files[i], {encoding: 'utf8'});
                let tokens = tokenize(source);
                rtnArray = rtnArray.concat(tokens)
    
            }
        }
        return rtnArray;

    }catch (err){
        console.error(err.message);

    }

};

let functionDeclarationSet = function(tokens) {

    //let tokens = tokenize(path);
    let contractCallableFuns = {"define-public": [], "define-read-only":[]};

    let len = tokens.length;

    let i = 0;

    let start = false;
    let tempStore;
    //let nameAndParaments = [];
    while(i < len) {
        if(tokens[i][0] === SYMBOL &&  ["define-public", "define-read-only"].includes(tokens[i][1])){
            start = true;
            tempStore = tokens[i][1];
            nameAndParaments = [];
            i++;
            continue;
        }
        if(start && tokens[i][0] === RIGHTPREN) {
            if(i + 1 < len && tokens[i + 1][0] === RIGHTPREN) {
                start = false;
                contractCallableFuns[tempStore].push([...nameAndParaments]);
            }
            i++;
            continue;
        }
        if(start) {
            if(tokens[i][0] === SYMBOL) {
                if(CLARTPYES.includes(tokens[i][1])) {
                    nameAndParaments[nameAndParaments.length - 1].push(tokens[i][1]);

                } else {
                    nameAndParaments.push([tokens[i][1]]);
                    if(i + 1 < len) {
                        if(tokens[i + 1][0] === RIGHTPREN){
                            start = false;
                            contractCallableFuns[tempStore].push([...nameAndParaments]);
                        }

                    }
                }
            }
        }
        i++;
    }
    return contractCallableFuns;
}


let stringifyArray = function(arr) {
    let accum = `\n\tFunction name: ${arr[0][0]}\n\tParameters {\n`;
    let len = arr.length;

    for(let i = 1; i < len; i++){
        accum += `\t\tname: ${arr[i][0]}  type: ${arr[i][1]}\n`;
    }

    return accum+"\t\t}";
};



let getFunctionSignature = function(name, tokens) {
    try {
        let done = false;
        let mapArrayofSignatures = functionDeclarationSet(tokens)
        for ( const key in mapArrayofSignatures) {
            let arr = mapArrayofSignatures[key];
            let len = arr.length;
            for (let  i = 0; i < len; i++) {
                if(arr[i][0][0] === name) {
                    let rtn = stringifyArray(arr[i]);
                    console.log('\x1b[1m', rtn);
                    done = true;
                    break;
                }
            }
            if(done){
                break;
            }
        }
        if(!done) {
            let msg = `\n\tFunction, ${name}, is either not callable from contract or does not exist\n`;
            console.log('\x1b[31m',msg)
            console.log("");
        }

    } catch(err) {
        console.error(err.message);
    }

};

let getFunctionsSignature = function(tokens) {
    try {
        let mapArrayofSignatures = functionDeclarationSet(tokens)
        let accum = "";
        for ( const key in mapArrayofSignatures) {
            let arr = mapArrayofSignatures[key];
            let len = arr.length;
            for(let i = 0; i < len; i++){
                accum += stringifyArray(arr[i]);
            }
            console.log('\x1b[1m',`\n\n\t${key} functions`);
                
            console.log(`${accum}`)
            accum = "";
        }
        console.log(accum);

    } catch(err) {
        console.error(err.message);
    }
};


module.exports = {
    getFunctionsSignature,
    getFunctionSignature,
    tokenizeInsideOfFolder
}
