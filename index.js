const IpfsHttpClient = require('ipfs-http-client')
const { globSource } = IpfsHttpClient
const ipfs = IpfsHttpClient()

async function add() {
    const file = await ipfs.add(globSource('./docs', { recursive: true }))
    console.log('Added file:', file.path, file.cid);
    return file.cid
}

async function retrieve(cid) {
    const chunks = []
    retrievedCat = await ipfs.cat(cid.concat('/teste.txt'));
    for await (const chunk of retrievedCat) {
        chunks.push(chunk)
    }
    console.log('File contents:', Buffer.concat(chunks).toString())

    retrievedData = await ipfs.ls(cid);
    for await (const a of retrievedData) {
        console.log(a);
    }

    retrievedGet = await ipfs.get(cid);
    for await (const a of retrievedGet) {
        console.log(a);
    }

    //documentation for ipfs.files at: https://github.com/ipfs/js-ipfs/blob/master/docs/core-api/FILES.md#the-mutable-files-api
    retrievedStat = await ipfs.files.stat('/');
    console.log(retrievedStat);
}

const cid = "QmWV5f7cTqDhu3P9zKo7MhTC9MadEtD2HhnzSzmwsEFcat";
retrieve(cid);