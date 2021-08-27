const servers = [
    {
        ip: "localhost",
        port: 6969
    }
]

function getServers(req, res) {
    res.send(servers);
}

module.exports = { getServers }