
function registerUser(req, res) {
    console.log(req.body.hello);
    res.send({ test: "ok" });
}

module.exports = { registerUser }