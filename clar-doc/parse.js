var fs = require('fs');

const CLARTPYES = ["int", "uint", "principal", "bool", "tuple", "list"];

let getContractFolder = function(path) { 
    const EXTENSIONLENGTH = 4;
    let path = path || "./";
    let arrOfdirs = path.split('/');
    if(arrOfdirs[arrOfdirs.length - 1] === "contracts") {
        return path;
    }
    let files = fs.readdirSync(path);
    let len = files.length;
    let  isDirExist;
    for(let i = 0; i < len; i++){
        if(files[i].length > EXTENSIONLENGTH && files[i].substr(-4) === ".clar"){
            return path;
        }

        let newPath = path === "./"? path+files[i]:path+"/"+files[i];
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
const COMMENT = 4;
const SYMBOLSTATE = 1
const STARTSTATE = 0;
const OTHERSTATE = 2;
const COMMENTSTATE = 3;

let tokenize = function(source) {   
    let len = source.length;
    let i = 0;
    let rtnArray = [];
    if(len === 0) {
        return rtnArray;
    }
    let accum = '';
    let state = 0;
    while(i < len) {
        if(state === STARTSTATE) {
            if(source[i] === ')') {
                rtnArray.push([RIGHTPREN, ')']);
            } else if(source[i] === '(') {
                rtnArray.push([LEFTPREN,'(']);
            } else if(source[i] >= 'a' && source[i] <= 'z') {
                accum = source[i];
                state = SYMBOLSTATE;
            } else if(source[i] === ';') {
                state = COMMENTSTATE;
                accum = '';
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
        } else if(state === COMMENTSTATE) {
            if(source[i] !== '\n'){
                accum += source[i];
            } else {
                rtnArray.push([COMMENT, accum]);
                state = STARTSTATE;
                accum = '';
            }
            i++;
        } else if(state === OTHERSTATE) {
            if(!['"', ')', '(', ';'].includes(source[i])) {
                i++;
            } else {
                state = STARTSTATE;
            }
        } 
    }
    return rtnArray;
};

let groupFunctions = function(source) {
    let tokens = tokenize(source);
    let contractCallableFuns = {"define-public": [], "define-read-only":[]};
    let len = tokens.length, i = 0, start = false, comments = [];
    let tempStore;
    
    while(i < len) {
        if(tokens[i][0] === COMMENT) {
            comments.push(tokens[i][1].trim());
        }
        if(tokens[i][0] === SYMBOL &&  ["define-public", "define-read-only"].includes(tokens[i][1])){
            start = true;
            tempStore = tokens[i][1];
            let ncomments = [COMMENT, ...comments];
            comments = [];
            nameAndParaments = [ncomments];
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
};


module.exports = {
    groupFunctions
}
