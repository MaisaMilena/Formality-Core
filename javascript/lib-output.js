var fs = require("fs");
var fmc = require("./../FormalityCore.js");
var cmp = require("./../Compiler.js");

const return_type = {
  status: 0,
  message: [""]
}

function load(dir = ".", ext = ".fmc", parse_defs = fmc.parse_defs) {
  var result = {files: {}, defs: {}, msg: "", status: 0};
  var files = fs.readdirSync(dir).filter(file => file.slice(-ext.length) === ext);
  if (files.length === 0) {
    msg = msg.message.push("No local " + ext + " file found.");
    process.exit();
  } else {
    // var result = {files: {}, defs: {}};
    for (var file of files) {
      var file_code = fs.readFileSync(file, "utf8");
      try {
        var file_defs = parse_defs(file_code, 0, file);
      } catch (err) {
        msg = msg.message.push("\n\x1b[1mInside '\x1b[4m"+file+"\x1b[0m'"
                  + "\x1b[1m:\x1b[0m\n" + err);
        process.exit();
      }
      for (var name in file_defs) {
        if (result.defs[name]) {
          msg = msg.message.push("Redefinition of '" + name + "' in '" + file + "'.");
          process.exit();
        } else {
          result.defs[name] = file_defs[name];
          result.files[name] = file_code;
          result.status = 1
        }
      }
    }
  }
  return result;
};

function report(main = "main", dir, ext, parse) {
  var {defs, files} = load(dir, ext, parse);

  // Normalizes and type-checks all terms
  // msg = msg.message.push("\033[4m\x1b[1mType-checking:\x1b[0m");
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
      msg = msg.message.push(show_name + " : " + fmc.stringify_term(fmc.typecheck(defs[name].term, defs[name].type, defs)));
    } catch (err) {
      msg = msg.message.push(show_name + " : " + "\x1b[31merror\x1b[0m");
      errors.push([name, err]);
    }
  };
  msg = msg.message.push("");

  if (errors.length > 0) {
    msg = msg.message.push("\033[4m\x1b[1mFound " + errors.length + " type error(s):\x1b[0m");
    for (var i = 0; i < errors.length; ++i) {
      var err_msg = fmc.stringify_err(errors[i][1], files[errors[i][0]]);
      msg = msg.message.push("\n\x1b[1mInside \x1b[4m" + errors[i][0]
        + "\x1b[0m\x1b[1m:\x1b[0m\n" + err_msg); 
    };
  } else {
    msg = msg.message.push("\033[4m\x1b[1mAll terms check.\x1b[0m");
  };

  if (defs[main]) {
    msg = msg.message.push("");
    msg = msg.message.push("\033[4m\x1b[1mEvaluating `main`:\x1b[0m");
    try {
      msg = msg.message.push(fmc.stringify_term(fmc.normalize(defs[main].term, defs)));
    } catch (e) {
      msg = msg.message.push("Error.");
    }
  };

  return msg;
};

function js(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    msg = msg.message.push("Term '" + main + "' not found.");
  } else {
    msg = msg.message.push(cmp.js(defs, main));
  };
  return msg;
};

function hs(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    msg = msg.message.push("Term '" + main + "' not found.");
  } else {
    msg = msg.message.push(cmp.hs(defs, main));
  };
  return msg;
};

function run(main = "main", dir, ext, parse) {
  var {defs} = load(dir, ext, parse);
  if (!defs[main]) {
    msg = msg.message.push("Term '" + main + "' not found.");
  } else {
    eval(cmp.js(defs, main));
  };
  return msg;
};

module.exports = {load, report, run, js, hs, run};
