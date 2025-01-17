import path from 'path'; 
import sqlite3 from 'sqlite3';
const dbPath = path.dirname('database')
console.log(dbPath)
console.log("dbPath")

function createTables() {
    try {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error("Erro ao abrir o banco de dados:", err.message);
                return;
            }
            console.log("Banco de dados aberto com sucesso");
        });

        db.run(
            `CREATE TABLE IF NOT EXISTS BikeDriver (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT NOT NULL,
                senha TEXT NOT NULL,
                email TEXT NOT NULL,
                numero TEXT NOT NULL,
                matricula TEXT NOT NULL,
                eAlugador BOOLEAN NOT NULL,
                chavePix TEXT,
                punicao BOOLEAN,
                tempoPunicao TEXT,
                multa REAL
            )`, (err) => { 
                if (err) {
                    console.error("Erro ao criar a tabela BikeDriver: ", err.message);
                } else {
                    console.log("Tabela BikeDriver criada ou já existe");
                }
            });        

            db.run(
                `CREATE TABLE IF NOT EXISTS Bike (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    idBikeDriver INTEGER,
                    dataAluguel TEXT,
                    alugada BOOLEAN,
                    idAlugador INTEGER,
                    statusPagamento TEXT,
                    FOREIGN KEY (idAlugador) REFERENCES BikeDriver(id),
                    FOREIGN KEY (idBikeDriver) REFERENCES BikeDriver(id)
                )`, (err) => {
                    if (err) {
                        console.error("Erro ao criar a tabela Bike: ", err.message);
                    } else {
                        console.log("Tabela Bike criada ou já existe");
                    }
                });   
                
                db.run(
                    `CREATE TABLE IF NOT EXISTS Pagamento (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        idBike INTEGER NOT NULL,
                        idAlugador INTEGER NOT NULL,
                        chavePix TEXT NOT NULL,
                        valor REAL NOT NULL,
                        status TEXT NOT NULL,
                        dataPagamento TEXT,                       
                        FOREIGN KEY (idBike) REFERENCES Bike(id),
                        FOREIGN KEY (idAlugador) REFERENCES BikeDriver(id)
                    )`, (err) => {
                        if (err) {
                            console.error("Erro ao criar a tabela Bike: ", err.message);
                        } else {
                            console.log("Tabela Pagamento criada ou já existe");
                        }
                    }); 

                db.run(`
                CREATE TABLE IF NOT EXISTS Mapa (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    local TEXT NOT NULL,
                    espaco_1 INTEGER,
                    espaco_2 INTEGER,
                    espaco_3 INTEGER,
                    espaco_4 INTEGER,
                    espaco_5 INTEGER,
                    espaco_6 INTEGER,
                    espaco_7 INTEGER,
                    espaco_8 INTEGER,
                    espaco_9 INTEGER,
                    espaco_10 INTEGER,
                    FOREIGN KEY (espaco_1) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_2) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_3) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_4) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_5) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_6) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_7) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_8) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_9) REFERENCES Bike(id),
                    FOREIGN KEY (espaco_10) REFERENCES Bike(id)
                )
            `, (err) => {  
                if (err) {
                    console.error("Erro ao criar a tabela Mapa: ", err.message);
                } else {
                    console.log("Tabela Mapa criada ou já existe");
                }
            });  
        
    } catch (err) {
        console.error("Erro ao criar as tabelas:", err);
    }
};

createTables();

const db = new sqlite3.Database(dbPath, (err) => {
    if(err){
        console.error('Erro ao abrir o banco de dados' , err.message)
        return
    }
    console.log('Banco de dados aberto com sucesso')
})

export default db;