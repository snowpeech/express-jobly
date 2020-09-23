/** Generate query string for creating new row in a table, given an object with inputs (obj) and the table name (table)
 */
function sqlForPost(obj, table) {
  let fields = [];
  let values = [];
  let idxArr = [];
  console.log("SQLFORPOST", obj, table);
  let idx = 1;
  for (let field in obj) {
    fields.push(field);
    values.push(obj[field]);
    idxArr.push(`$${idx}`);
    idx += 1;
  }

  let cols = fields.join(", ");
  let idxs = idxArr.join(", ");
  console.log("SQLFORPOST COLS & IDXARR", cols, idxArr);
  const queryStr = `INSERT INTO ${table} (${cols}) VALUES (${idxs}) RETURNING *`;
  console.log("SQLFORPOST QUERY & VALUES", queryStr, "!!!!!!!!!!!!!!!", values);
  return { queryStr, values };
}

module.exports = sqlForPost;
