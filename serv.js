const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    if (req.headers['getdata']) {
        console.log("File request");
        res.status(200).sendFile(path.join(__dirname,'static', 'screenCapture.zip'));
        console.log("Sended")
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

    socket.on('upload_image', (data, headers) => {
        const base64Image = data.image;
        const imageBuffer = Buffer.from(base64Image, 'base64');
        fs.writeFile(path.join(__dirname,'static', 'data', headers["name"] + '.jpg'), imageBuffer, err => {
            // if (err) {
            //     console.error(err);
            // } else {
                
                console.log("it will be uploaded");
                // const auth = new google.auth.GoogleAuth({
                //     keyFile: path.join(__dirname,"security.json"),
                //     scopes: ['https://www.googleapis.com/auth/drive'],
                // });
                // const drive = google.drive({version: 'v3', auth});
                // const response = drive.files.create({
                //     requestBody: {
                //         name: headers["name"]+getCurrentDate(),
                //         mimeType: 'image/jpg',
                //         parents: ['1HskEq4Ss7iKtpsuh8h9mp2zr1LqHALTw']
                //     },
                //     media: {
                //         mimeType: 'image/jpg',
                //         body: fs.createReadStream(path.join(__dirname,'static', 'data', headers["name"] + '.jpg'))
                //     }
                // });
                socket.emit('image_processed')
            // }
        });
    });
    socket.on('message', (data) => {
        console.log('Сообщение от клиента: ', data);
      });

    socket.on('disconnect', () => {
        console.log("User is disconected: " + socket.id);
    });
});

function getCurrentDate() {
    const date = new Date();
    const seconds = date.getSeconds();
    const miliseconds = date.getMilliseconds();
    return `${seconds}-${miliseconds}`;
}
