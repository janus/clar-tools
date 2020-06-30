const parser = require('./parse.js');
const procss = require("process");
const fs = require('fs');

const COMMENT = 4;


let paramBuilder = function(paramArray) {
    let i = 1, len = paramArray.length, arr = [];
    while(i < len) {
        let template = `<tr><td>${paramArray[i]}</td><td>${paramArray[i+1]}</td></tr>`;

        arr.push(template);
        i += 2;
    }
    if(i > 1) {
        arr.unshift(`<tr><td>name</td><td>type</td></tr>`);
        arr.unshift('<table>');
        arr.unshift('<h4>Parameters</h4>');
        arr.push('</table>');
        return arr.join('');
    } else {
        return '';
    }
} 


let htmlBuilder = function(family, grouped) {
    let len = grouped.length, rtnArr = [];
    for(let i = 0; i < len; i++){
        let element = grouped[i];
        let elementLen = element.length;
        let comments = '';
        let functionName = '', paramsFn = [], paramsWithoutType = []; 
        for(let j = 0; j < elementLen; j++){
            if(element[j][0] === COMMENT) {
                comments = element[j].slice(1).join(" ");

            } else if(element[j].length === 1) {
                paramsFn.push(element[j]);
                paramsWithoutType.push(element[j]);
                functionName = `<h5 class = functionname>Function  Name: ${element[j]}</h5>`;

            } else {
                paramsFn.push(element[j][0]);
                paramsFn.push(element[j][1]);
                paramsWithoutType.push(element[j][0]);
            }
        }
        //console.log(paramsWithoutType)
        rtnArr.push(`${functionName}<p class="signature">Function Call Signature: (${paramsWithoutType.join(" ")})</p>${paramBuilder(paramsFn)}<p>${comments}</p> `);
    }
    rtnArr.unshift(`<h4>${family}</h4>`);
    rtnArr.push('<hr>')
    return rtnArr.join("");

};


let header = function(filename){
    let files = filename.split(".");
    let nfiles =  files[files.length - 2].split("/");
    let head = `<html><head><title>${nfiles[nfiles.length - 1]}</title>
    <style>
    table {
        border-collapse: collapse;
      }
      
      table, th, td {
        border: 1px solid black;
      }

      th, td {
        text-align: left;
        padding: 8px;
      }

      .functionname {
        color: green;
        font-size: larger;
      }
      #header {
        margin-left: 25%;
        display:inline-block;
        font: italic small-caps bold 16px/2 cursive;
        background-color: #345265;
        padding-left: 10%;
        padding-right: 10%;
      }
      #header p{
          text-align: center;
      }
      #main {
        margin-left: 26%;
      }
    </style>
    
    
    </head><body>
    
    <div id=header><p>${nfiles[nfiles.length - 1]}(File) Public functions</p></div>
    <div id=main>`;
    return head;
};

let tail = function(){
    let mtail = `</div></body></html>`;
    return mtail;
};

let builder = function(filename, grp) {
   
    let htmlArr = [];
    htmlArr.push(header(filename));
    for(const key in grp) {
        htmlArr.push(htmlBuilder(key, grp[key]));

    }
    htmlArr.push(tail(filename));
    return htmlArr.join("");
};

let isDirExist = function(file) {
    return fs.existsSync(file) && fs.lstatSync(file).isDirectory();
};

let writeTofile = function(path, filename, data) {
    fs.writeFile(path+"/"+filename+".html", data, function(err){
        if(err) return console.log(err);
        console.log("Creates document file:"+path+"/"+filename+".html");
    });

};

let main = function() {
    try {
        let file = procss.argv[procss.argv.length - 1];
    
        if(isDirExist(file)) {
            let files = fs.readdirSync(file);
            let len = files.length;
            for(let i = 0; i < len; i++) {
                if(!isDirExist(file+"/"+files[i]) && files[i].endsWith(".clar")) {
                    if(!fs.existsSync(file+"/doc")) {
                        fs.mkdirSync(file+"/doc");
                    }
                    let source = fs.readFileSync(file+"/"+files[i], {encoding: 'utf8'});
                    let grp = parser.groupFunctions(source);
                    let rtn = builder(files[i], grp);
                    writeTofile(file+"/doc", files[i], rtn);
                }
            }
        } else {
            let source = fs.readFileSync(file, {encoding: 'utf8'});
            let grp = parser.groupFunctions(source);
            let rtn = builder(file, grp);
            if(!fs.existsSync("./doc")) {
                fs.mkdirSync("./doc");
            }
            let nfiles = file.split("/");
            writeTofile("./doc", nfiles[nfiles.length - 1], rtn);       
        }
    } catch(err) {
        console.error(err.message);
    }
};


main();