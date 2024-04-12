export function insertVariables(str, data) {
  if (data instanceof Object && Object.keys(data).length === 0) {
    return str;
  }
  if (typeof str === "string" && data instanceof Array) {
    return str.replace(/(\${\d})/g, function (i) {
      return data[i.replace(/\${/, "").replace(/}/, "")];
    });
  } else if (typeof str === "string" && data instanceof Object) {
    for (let key in data) {
      return str.replace(/(\${([^}]+)})/g, function (i) {
        let key = i.replace(/\${/, "").replace(/}/, "");
        if (!data[key]) {
          return i;
        }
        return data[key];
      });
    }
  } else {
    return str;
  }
}