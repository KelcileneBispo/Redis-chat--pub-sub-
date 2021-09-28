const express = require('express');
const app = express();
const PORT = 5000;
const http = require('http');
const socketio = require('socket.io')

const redis = require('redis');
const client = redis.createClient();

const sub = redis.createClient();
const pub = redis.createClient();


app.set("view engine", "ejs");

const server = http.createServer(app);
const io = socketio(server).listen(server);

function enviarMensagem(pub){

    //Salvando os dados com no banco Redis
    client.lrange("mensagems", "0", "-1", (err, data) => {
       

       data.map( d => {
            const nomeMensagem = d.split(":");
            const redisNome = nomeMensagem[0];
            const redisMensagem = nomeMensagem[1];
            const redisData = data[1]
            

        //utilizando o publish para mostrar as mensagens do banco redis
           pub.publish("mensagem", JSON.stringify({
                from: redisNome,
                mensagem: redisMensagem,
                data: redisData,



            }));
       });
    });
}



io.on("connection", socket => {
    enviarMensagem(pub);
    socket.on("mensagem", ({mensagem, from, time}) => {
      
        //utilizando o subscribe para mostrar as mensagens do banco  
        sub.subscribe("mensagems", ` ${time} = ${from}: ${mensagem}`);
        io.emit("mensagem", {from, mensagem, time})
    })
})

app.get("/chat", (req,res) => {
    const nome = req.query.nome;

    io.emit("chatnome", nome);
    res.render("chat",{nome})
})

app.get("/", (req,res) => {
    res.render("index");
});

server.listen(PORT, () => {
    console.log(`Server iniciado na porta ${PORT}`)
});