const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const QRCode = require('qrcode');

function crc16CCITTFalse(content) {
    let crc = 0xFFFF;
    for (let i = 0; i < content.length; i++) {
        const c = content.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

const HAS_CHILDREN = [26, 51, 62];

class Value {
    constructor(data) {
        if (typeof data === 'string') {
            this.type = 'value';
            this.data = data;
        } else if (Array.isArray(data)) {
            this.type = 'nodes';
            this.data = data;
        }
    }

    isValue() {
        return this.type === 'value';
    }

    isNodes() {
        return this.type === 'nodes';
    }

    getValue() {
        return this.isValue() ? this.data : null;
    }

    getNodes() {
        return this.isNodes() ? this.data : null;
    }
}

class Node {
    constructor(code, value) {
        this.code = code;
        this.value = value instanceof Value ? value : new Value(value);
    }

    dumps() {
        let dumped = this.code.toString().padStart(2, '0');
        let result = '';
        
        if (this.value.isNodes()) {
            result = this.value.getNodes().map(node => node.dumps()).join('');
        } else {
            const val = this.value.getValue();
            result = val.length.toString().padStart(2, '0') + val;
        }

        if (HAS_CHILDREN.includes(this.code)) {
            dumped += result.length.toString().padStart(2, '0');
        }
        
        dumped += result;
        return dumped;
    }

    addOrUpdate(node) {
        if (this.value.isNodes()) {
            const nodes = this.value.getNodes();
            const existingNode = nodes.find(n => n.code === node.code);
            if (existingNode) {
                existingNode.value = node.value;
            } else {
                nodes.push(node);
            }
        } else {
            throw new Error('value is not Nodes type');
        }
    }

    toDict() {
        if (this.value.isNodes()) {
            const result = {};
            this.value.getNodes().forEach(node => {
                const nodeDict = node.toDict();
                result[node.code] = nodeDict[node.code];
            });
            return { [this.code]: result };
        } else {
            return { [this.code]: this.value.getValue() };
        }
    }
}

class Nodes {
    constructor(nodes = []) {
        this.nodes = nodes;
    }

    static readIO(data, position, size) {
        if (position + size > data.length) {
            throw new Error('Not enough data to read');
        }
        return data.substring(position, position + size);
    }

    verify() {
        const content = this.dumps();
        const lenContent = content.length;
        const computed = crc16CCITTFalse(content.substring(0, lenContent - 4));
        const qrisCrc = content.substring(lenContent - 4);
        return computed === qrisCrc;
    }

    dumps() {
        return this.nodes.map(node => node.dumps()).join('');
    }

    addOrUpdate(node) {
        const existingNode = this.nodes.find(n => n.code === node.code);
        if (existingNode) {
            existingNode.value = node.value;
        } else {
            this.nodes.push(node);
            this.nodes.sort((a, b) => a.code - b.code);
        }
    }

    rewriteCrc16() {
        const dumps = this.dumps();
        const content = crc16CCITTFalse(dumps.substring(0, dumps.length - 4));
        this.nodes.forEach(node => {
            if (node.code === 63) {
                node.value = new Value(content);
            }
        });
    }

    setMerchantName(name) {
        if (name && name.length > 0) {
            this.addOrUpdate(new Node(59, new Value(name.substring(0, 25))));
        }
    }

    getMerchantName() {
        return this.getStrValue(59);
    }

    setMerchantCity(city) {
        if (city && city.length > 0) {
            this.addOrUpdate(new Node(60, new Value(city.substring(0, 15))));
        }
    }

    getMerchantCity() {
        return this.getStrValue(60);
    }

    setPostalCode(code) {
        if (code && code.length > 0) {
            this.addOrUpdate(new Node(61, new Value(code.substring(0, 10))));
        }
    }

    getPostalCode() {
        return this.getStrValue(61);
    }

    getStrValue(code) {
        const value = this.get(code);
        if (value && value.isValue()) {
            return value.getValue();
        }
        return null;
    }

    setAmount(amount) {
        amount = parseFloat(amount);
        
        if (amount && amount > 0) {
            this.addOrUpdate(new Node(1, new Value('12')));
            this.addOrUpdate(new Node(54, new Value(amount.toString())));
        } else {
            this.addOrUpdate(new Node(1, new Value('11')));
            this.nodes = this.nodes.filter(node => node.code !== 54);
        }
    }

    getAmount() {
        return this.getStrValue(54);
    }

    setTipIndicator(tipIndicator) {
        if (tipIndicator) {
            this.addOrUpdate(new Node(55, new Value(tipIndicator)));
        }
    }

    getTipIndicator() {
        return this.getStrValue(55);
    }

    setConvenienceFee(fee) {
        if (fee) {
            this.addOrUpdate(new Node(56, new Value(fee)));
        }
    }

    getConvenienceFee() {
        return this.getStrValue(56);
    }

    setTransactionCurrency(currency = '360') {
        this.addOrUpdate(new Node(53, new Value(currency)));
    }

    getTransactionCurrency() {
        return this.getStrValue(53);
    }

    setCountryCode(countryCode = 'ID') {
        this.addOrUpdate(new Node(58, new Value(countryCode)));
    }

    getCountryCode() {
        return this.getStrValue(58);
    }

    getNestedValue(parentCode, childCode) {
        const parentValue = this.get(parentCode);
        if (parentValue && parentValue.isNodes()) {
            const childNode = parentValue.getNodes().find(node => node.code === childCode);
            if (childNode && childNode.value.isValue()) {
                return childNode.value.getValue();
            }
        }
        return null;
    }

    setNestedValue(parentCode, childCode, value) {
        const parentValue = this.get(parentCode);
        if (parentValue && parentValue.isNodes()) {
            const childNodes = parentValue.getNodes();
            const childNode = childNodes.find(node => node.code === childCode);
            if (childNode) {
                childNode.value = new Value(value);
            } else {
                childNodes.push(new Node(childCode, new Value(value)));
                childNodes.sort((a, b) => a.code - b.code);
            }
        }
    }

    ensureRequiredFields() {
        if (!this.get(0)) this.addOrUpdate(new Node(0, new Value('01')));
        if (!this.get(1)) this.addOrUpdate(new Node(1, new Value('11')));
        if (!this.get(52)) this.addOrUpdate(new Node(52, new Value('5411')));
        if (!this.get(53)) this.addOrUpdate(new Node(53, new Value('360')));
        if (!this.get(58)) this.addOrUpdate(new Node(58, new Value('ID')));
    }

    static fromStr(code) {
        const nodeVec = Nodes.fromStrToNodeVec(code);
        if (nodeVec.isNodes()) {
            return new Nodes(nodeVec.getNodes());
        } else {
            throw new Error(nodeVec.getValue());
        }
    }

    get(code) {
        const node = this.nodes.find(n => n.code === code);
        return node ? node.value : null;
    }

    static fromStrToNodeVec(code) {
        let position = 0;
        const result = [];

        while (position < code.length) {
            try {
                const codeStr = Nodes.readIO(code, position, 2);
                position += 2;
                
                const codeIn = parseInt(codeStr);
                const sizeStr = Nodes.readIO(code, position, 2);
                position += 2;
                
                const sizeIn = parseInt(sizeStr);

                if (HAS_CHILDREN.includes(codeIn)) {
                    const childrenData = Nodes.readIO(code, position, sizeIn);
                    position += sizeIn;
                    const children = Nodes.fromStrToNodeVec(childrenData);
                    if (children.isNodes()) {
                        result.push(new Node(codeIn, children));
                    }
                } else {
                    const valueData = Nodes.readIO(code, position, sizeIn);
                    position += sizeIn;
                    result.push(new Node(codeIn, new Value(valueData)));
                }
            } catch (e) {
                break;
            }
        }

        return new Value(result);
    }

    toDict() {
        const result = {};
        this.nodes.forEach(node => {
            if (node.value.isNodes()) {
                const childResult = {};
                node.value.getNodes().forEach(childNode => {
                    const childDict = childNode.toDict();
                    childResult[childNode.code] = childDict[childNode.code];
                });
                result[node.code] = childResult;
            } else {
                result[node.code] = node.value.getValue();
            }
        });
        return result;
    }
}

class QRIS {
    constructor(nodes) {
        this.nodes = nodes instanceof Nodes ? nodes : new Nodes();
    }

    static async fromPath(imagePath) {
        try {
            const image = await loadImage(imagePath);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                const nodes = Nodes.fromStr(code.data);
                return new QRIS(nodes);
            } else {
                throw new Error('QR not detected');
            }
        } catch (e) {
            throw new Error('Error to obtain image: ' + e.message);
        }
    }

    static fromStr(code) {
        try {
            const nodes = Nodes.fromStr(code);
            return new QRIS(nodes);
        } catch (e) {
            throw new Error('Parsing error: ' + e.message);
        }
    }

    static fromDict(data) {
        try {
            const nodeVec = QRIS.dictToNodes(data);
            if (nodeVec.isNodes()) {
                const nodes = new Nodes(nodeVec.getNodes());
                nodes.ensureRequiredFields();
                return new QRIS(nodes);
            } else {
                throw new Error('invalid structure');
            }
        } catch (e) {
            throw new Error('Parsing error: ' + e.message);
        }
    }

    static dictToNodes(data) {
        if (typeof data === 'string') {
            return new Value(data);
        } else if (typeof data === 'object' && data !== null) {
            const nodeVec = [];
            const sortedKeys = Object.keys(data).map(k => parseInt(k)).sort((a, b) => a - b);
            
            sortedKeys.forEach(key => {
                const value = data[key];
                const nodeValue = QRIS.dictToNodes(value);
                nodeVec.push(new Node(key, nodeValue));
            });
            
            return new Value(nodeVec);
        }
        throw new Error('Invalid data type');
    }

    async save(path, width = 300) {
        try {
            await QRCode.toFile(path, this.nodes.dumps(), {
                width: width,
                margin: 2
            });
        } catch (e) {
            throw new Error('Error to save image: ' + e.message);
        }
    }

    toDict() {
        return this.nodes.toDict();
    }

    setMerchantName(name) {
        this.nodes.setMerchantName(name);
    }

    getMerchantName() {
        return this.nodes.getMerchantName();
    }

    setMerchantCity(city) {
        this.nodes.setMerchantCity(city);
    }

    getMerchantCity() {
        return this.nodes.getMerchantCity();
    }

    setPostalCode(code) {
        this.nodes.setPostalCode(code);
    }

    getPostalCode() {
        return this.nodes.getPostalCode();
    }

    setAmount(amount) {
        this.nodes.setAmount(amount);
    }

    getAmount() {
        return this.nodes.getAmount();
    }

    dumps() {
        return this.nodes.dumps();
    }

    verify() {
        return this.nodes.verify();
    }

    rewriteCrc16() {
        this.nodes.rewriteCrc16();
    }

    toString() {
        return JSON.stringify(this.nodes, null, 2);
    }
}

module.exports = {
    QRIS,
    Nodes,
    Node,
    Value,
    crc16CCITTFalse
};

async function example1_CreateFromString() {
    console.log("=== Example 1: Create from QRIS String ===");
    
    const qrisString = "00020101021126570011ID.DANA.WWW011893600915350540793802095054079380303UMI51440014ID.CO.QRIS.WWW0215ID10232897192710303UMI5204899953033605802ID5908Putu Ofc6014Bandar Lampung610535118630406EA";
    
    const qris = QRIS.fromStr(qrisString);
    console.log("Original QRIS data:", qris.toDict());
    console.log("Merchant Name:", qris.getMerchantName());
    console.log("Merchant City:", qris.getMerchantCity());
    console.log("Verification:", qris.verify());
}

async function example2_CreateFromDict() {
    console.log("\n=== Example 2: Create from Dictionary ===");
    
    const qrisData = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "51": {
            "0": "ID.CO.QRIS.WWW",
            "2": "ID2024361846155",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "SIPUTZX PRODUCTION OK2143945",
        "60": "TULANG BAWANG",
        "61": "34595",
        "62": {
            "7": "A01"
        },
        "63": "5E19"
    };
    
    const qris = QRIS.fromDict(qrisData);
    console.log("Generated QRIS:", qris.dumps());
    console.log("Verification:", qris.verify());
}

async function example3_ModifyMerchantInfo() {
    console.log("\n=== Example 3: Modify Merchant Information ===");
    
    const qrisData = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "51": {
            "0": "ID.CO.QRIS.WWW",
            "2": "ID2024361846155",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "SIPUTZX PRODUCTION OK2143945",
        "60": "TULANG BAWANG",
        "61": "34595",
        "62": {
            "7": "A01"
        },
        "63": "5E19"
    };
    
    const qris = QRIS.fromDict(qrisData);
    
    console.log("Before modification:");
    console.log("Merchant Name:", qris.getMerchantName());
    console.log("Merchant City:", qris.getMerchantCity());
    console.log("Postal Code:", qris.getPostalCode());
    
    qris.setMerchantName("PENJUAL ANAK KECIL");
    qris.setMerchantCity("MEKSIKO");
    qris.setPostalCode("12550");
    
    qris.rewriteCrc16();
    
    console.log("\nAfter modification:");
    console.log("Merchant Name:", qris.getMerchantName());
    console.log("Merchant City:", qris.getMerchantCity());
    console.log("Postal Code:", qris.getPostalCode());
    console.log("Modified QRIS:", qris.dumps());
    console.log("Verification:", qris.verify());
    await qris.save('./paymr.png', 400);
    console.log("QR code saved as payment-qr.png");
}

async function example4_SetAmount() {
    console.log("\n=== Example 4: Set Transaction Amount ===");
    
    const qrisData = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "51": {
            "0": "ID.CO.QRIS.WWW",
            "2": "ID2024361846155",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "SIPUTZX PRODUCTION",
        "60": "TULANG BAWANG",
        "61": "34595",
        "62": {
            "7": "A01"
        },
        "63": "5E19"
    };
    
    const qris = QRIS.fromDict(qrisData);
    
    console.log("Static QRIS (no amount):");
    console.log("Point of Initiation:", qris.nodes.getStrValue(1));
    console.log("Amount:", qris.getAmount());
    
    qris.setAmount(75000);
    qris.rewriteCrc16();
    
    console.log("\nDynamic QRIS (with amount):");
    console.log("Point of Initiation:", qris.nodes.getStrValue(1));
    console.log("Amount:", qris.getAmount());
    console.log("QRIS with amount:", qris.dumps());
    console.log("Verification:", qris.verify());
    
    qris.setAmount(0);
    qris.rewriteCrc16();
    
    console.log("\nBack to static QRIS:");
    console.log("Point of Initiation:", qris.nodes.getStrValue(1));
    console.log("Amount:", qris.getAmount());
    console.log("Verification:", qris.verify());
}

async function example5_SaveQRImage() {
    console.log("\n=== Example 5: Save as QR Image ===");
    
    const qrisData = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "TOKO ONLINE SIPUTZX",
        "60": "JAKARTA",
        "61": "12345",
        "63": "0000"
    };
    
    const qris = QRIS.fromDict(qrisData);
    qris.setAmount(100000);
    qris.rewriteCrc16();
    
    try {
        await qris.save('./payment-qr.png', 400);
        console.log("QR code saved as payment-qr.png");
        console.log("QRIS data:", qris.dumps());
        console.log("Amount: Rp", qris.getAmount());
    } catch (error) {
        console.error("Failed to save QR:", error.message);
    }
}

async function example6_ReadFromImage() {
    console.log("\n=== Example 6: Read from QR Image ===");
    
    try {
        const qris = await QRIS.fromPath('./payment-qr.png');
        console.log("QRIS from image:");
        console.log("Merchant Name:", qris.getMerchantName());
        console.log("Amount:", qris.getAmount());
        console.log("Raw QRIS:", qris.dumps());
    } catch (error) {
        console.error("Failed to read QR image:", error.message);
    }
}

async function example7_GetAllInfo() {
    console.log("\n=== Example 7: Get All QRIS Information ===");
    
    const qrisData = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "51": {
            "0": "ID.CO.QRIS.WWW",
            "2": "ID2024361846155",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "SIPUTZX PRODUCTION OK2143945",
        "60": "TULANG BAWANG",
        "61": "34595",
        "62": {
            "7": "A01"
        },
        "63": "5E19"
    };
    
    const qris = QRIS.fromDict(qrisData);
    
    console.log("Complete QRIS Information:");
    console.log("Format Indicator:", qris.nodes.getStrValue(0));
    console.log("Point of Initiation:", qris.nodes.getStrValue(1));
    console.log("Merchant Category Code:", qris.nodes.getStrValue(52));
    console.log("Transaction Currency:", qris.nodes.getStrValue(53));
    console.log("Country Code:", qris.nodes.getStrValue(58));
    console.log("Merchant Name:", qris.getMerchantName());
    console.log("Merchant City:", qris.getMerchantCity());
    console.log("Postal Code:", qris.getPostalCode());
    
    console.log("\nNested Values:");
    console.log("Bank Account (26-1):", qris.nodes.getNestedValue(26, 1));
    console.log("QRIS ID (51-2):", qris.nodes.getNestedValue(51, 2));
    console.log("Additional Info (62-7):", qris.nodes.getNestedValue(62, 7));
}

async function example8_CompleteWorkflow() {
    console.log("\n=== Example 8: Complete Payment Workflow ===");
    
    const originalQris = {
        "0": "01",
        "1": "11",
        "26": {
            "0": "COM.NOBUBANK.WWW",
            "1": "936005030000087914",
            "2": "52051857831441",
            "3": "UMI"
        },
        "51": {
            "0": "ID.CO.QRIS.WWW",
            "2": "ID2024361846155",
            "3": "UMI"
        },
        "52": "5411",
        "53": "360",
        "58": "ID",
        "59": "MERCHANT TEMPLATE",
        "60": "KOTA TEMPLATE",
        "61": "00000",
        "62": {
            "7": "A01"
        },
        "63": "0000"
    };
    
    const qris = QRIS.fromDict(originalQris);
    
    console.log("Step 1: Create base QRIS template");
    console.log("Template QRIS:", qris.dumps());
    
    console.log("\nStep 2: Customize for specific merchant");
    qris.setMerchantName("WARUNG MAKAN SIPUTZX");
    qris.setMerchantCity("BANDUNG");
    qris.setPostalCode("40111");
    
    console.log("\nStep 3: Set transaction amount");
    qris.setAmount(45000);
    
    console.log("\nStep 4: Generate final QRIS");
    qris.rewriteCrc16();
    
    console.log("Final QRIS:", qris.dumps());
    console.log("Merchant:", qris.getMerchantName());
    console.log("City:", qris.getMerchantCity());
    console.log("Amount: Rp", qris.getAmount());
    console.log("Valid:", qris.verify());
    
    console.log("\nStep 5: Create different amount for same merchant");
    qris.setAmount(25000);
    qris.rewriteCrc16();
    
    console.log("New amount QRIS:", qris.dumps());
    console.log("New amount: Rp", qris.getAmount());
    console.log("Still valid:", qris.verify());
}

async function runAllExamples() {
    try {
        await example1_CreateFromString();
        await example2_CreateFromDict();
        await example3_ModifyMerchantInfo();
        await example4_SetAmount();
        await example5_SaveQRImage();
        await example6_ReadFromImage();
        await example7_GetAllInfo();
        await example8_CompleteWorkflow();
    } catch (error) {
        console.error("Error:", error.message);
    }
}

runAllExamples();