import express from 'express';
import multer from 'multer';
import sqlite3 from 'sqlite3';


const upload = multer();
const dbpath = './src/database/bike.db';
const db = new sqlite3.Database(dbpath);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = express.Router();


export const addBikeDriver = (req, res) => {
    if(req.eAlugador != 'true'){
        req.eAlugador = true;
        req.chavePix = '';
    }else{
        req.eAlugador = false
    }    
    const {usuario, email, numero, matricula, eAlugador, bikeCount, chavePix, senha} = req;  

    const query = `INSERT INTO BikeDriver (usuario, email, numero, matricula, eAlugador, chavePix, senha)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run( query, [usuario, email, numero, matricula, eAlugador, chavePix, senha], function(err){
        res(err, this.lastID)
    })
}

export const addBike = (req, res) => {
    const {idBikeDriver, dataAluguel, alugada} = req;
    const query = `INSERT INTO Bike (idBikeDriver, dataAluguel, alugada)
                    VALUES (?, ?, ?)`;
    db.run(query,[idBikeDriver, dataAluguel, alugada], (err)=>{
        res(err, this.lastID)
    })
}


export const addMapa = (req, res) => {
    const { local, bicicletasList } = req;
    const query = `INSERT INTO Mapa (local, espaco_1, espaco_2, espaco_3, espaco_4, espaco_5, espaco_6, espaco_7, espaco_8, espaco_9, espaco_10)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query,[local, bicicletasList], (err)=>{
        res(err, this.lastID)
    })
}

