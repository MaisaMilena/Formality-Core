var fs = require("fs");
var fmc = require("./../FormalityCore.js");
var cmp = require("./../Compiler.js");

function load(dir = ".", ext = ".fmc", parse_defs = fmc.parse_defs) {
  var files = fs.readdirSync(dir).filter(file => file.slice(-ext.length) === ext);
  if (files.length === 0) {
    console.error("No local " + ext + " file found.");
    process.exit(1);
  } else {
    var result = {files: {}, defs: {}};
    for (var file of files) {
      var file_code = fs.readFileSync(file, "utf8");
      try {
        var file_defs = parse_defs(file_code, 0, file);
      } catch (err) {
        console.error("\n\x1b[1mInside '\x1b[4m"+file+"\x1b[0m'"
                  + "\x1b[1m:\x1b[0m\n" + err);
        //console.log(err);
        process.exit(1);
      }
      for (var name in file_defs) {
        if (result.defs[name]) {
          console.error("Redefinition of '" + name + "' in '" + file + "'.");
          process.exit(1);
        } else {
          result.defs[name] = file_defs[name];
          result.files[name] = file_code;
        }
      }
    }
  }
  return result;
};

function report(main = "main", dir, ext, parse) {
  var {defs, files} = load(dir, ext, parse);

  // Normalizes and type-checks all terms
  console.log("\033[4m\x1b[1mType-checking:\x1b[0m");
  var errors = [];
  var max_len = 0;
  for (var name in defs) {
    max_len = Math.max(name.length, max_len);
  };
  for (var name in defs) {
    var show_name = name;
    while (show_name.length < max_len) {
      show_name = show_name + " ";
    }
    try {
      console.log(show_name + " : " + fmc.stringify(fmc.typecheck(defs[name].term, defs[name].type, defs)));
    } catch (err) {
      console.log(show_name + " : " + "\x1b[31merror\x1b[0m");
      errors.push([name, err]);
    }
  };
  console.log("");

  if (errors.length > 0) {
    console.error("\033[4m\x1b[1mFound " + errors.length + " type error(s):\x1b[0m");
    for (var i = errors.length - 1; i >= 0; --i) {
      var err_msg = fmc.stringify_err(errors[i][1], files[errors[i][0]]);
      console.error("\n\x1b[1mInside \x1b[4m" + errors[i][0]
        + "\x1b[0m\x1b[1m:\x1b[0m\n" + err_msg); 
      process.exit(1);
    };
  } else {
    console.log("\033[4m\x1b[1mAll terms check.\x1b[0m");
    process.exit(0);
  };

  if (defs[main]) {
    console.log("");
    console.log("\033[4m\x1b[1mEvaluating `main`:\x1b[0m");
    try {
      console.log(fmc.stringify(fmc.normalize(defs[main].term, defs)));
    } catch (e) {
      console.error("Error.");
      process.exit(1);
    }
  };
};

function js(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    console.error("Term '" + main + "' not found.");
    process.exit(1);
  } else {
    console.log(cmp.js(defs, main));
  };
};

function hs(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    console.error("Term '" + main + "' not found.");
    process.exit(1);
  } else {
    console.log(cmp.hs(defs, main));
  };
};

function run(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    console.error("Term '" + main + "' not found.");
    process.exit(1);
  } else {
    eval(cmp.js(defs, main));
  };
};

module.exports = {load, report, run, js, hs, run};