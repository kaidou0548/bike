import 'dotenv/config'; 
import express from 'express';
import twilio from 'twilio';
import fetch from 'node-fetch';
//import Gerencianet from 'gerencianet';  
import bcrypt from 'bcryptjs';
import moment from 'moment';
import sqlite3 from 'sqlite3';

const control = express.Router();
const dbpath = './src/database/bike.db';
const db = new sqlite3.Database(dbpath);

const SID_TWILIO = process.env.SID_TWILIO;
const AUTH_TOKEN_TWILIO = process.env.AUTH_TOKEN_TWILIO;
const CLIENT = new twilio(SID_TWILIO, AUTH_TOKEN_TWILIO);

/*const gerencianet = Gerencianet({
    client_id: process.env.CLIENT_ID_GERENCIANET,
    client_secret: process.env.CLIENT_SECRET_GERENCIANET,
    sandbox: true,
    cert: './path/to/certificate.pem', // Adicione o caminho para o certificado, se necessário
    key: './path/to/private_key.pem'   // Adicione o caminho para a chave privada, se necessário
});
*/

/*
const credentials = {
    clientID: process.env.CLIENT_ID_GERENCIANET,
    clientSecret: process.env.CLIENT_SECRET_GERENCIANET,
    entrypoint: process.env.ENTRYPOINT, // O endpoint da Gerencianet (sandbox ou produção)
    certificate: process.env.CERTIFICATE_PATH // Caminho para o certificado
};
 */

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



control.post('/login', (req, res) => {
    let {usuario, senha} = req.body;

    if (!usuario) {
        return res.status(400).json({error: 'O campo usuario é obrigatório', status:'usuario'});
    }
    if (!senha) {
        return res.status(400).json({error: 'O campo senha é obrigatório', status:'senha'});
    }
    const query = `SELECT * FROM BikeDriver WHERE usuario = ?`;
    db.get(query,[usuario],(err,row) => {
        if(err){
            return res.status(500).json({error : 'Erro ao acessar o banco'})
        }

        if(!row){
            return res.status(404).json({error: 'Usuario não encontrado', status:'inexiste'})
        }

        bcrypt.compare(senha, row.senha, (err, result) => {
            if(err)
                return res.status(500).json({error: 'Erro ao comparar senhas'})

            if(!result)
                return res.status(500).json({error: 'Senha incorreta', status:'incorreta'}) 
                
            req.session.userId = row.id; 
            req.session.usuario = row.usuario;

            return res.status(200).json({message: 'Login bem-sucedido'});
        });
    });
});

control.post('/pedalar', (req, res) => {
    const { bikeId, local, userId, index } = req.body;

    db.get('SELECT * FROM BikeDriver WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
        }
        
        if (user.punicao) {
            
            const dataPunicao = moment(user.tempoPunicao); 
            const tempoPunicaoEmMinutos = moment().diff(dataPunicao, 'minutes'); 
            const punicaoValor = tempoPunicaoEmMinutos >= 3 ? Math.floor(tempoPunicaoEmMinutos / 3) * 2 : 0;

            
            if (punicaoValor > 0) {
                alert({ message: `Você está com uma multa de R$  ${punicaoValor}`});
            }

            const pix = new Promise((resolve, reject) => {
                db.get('SELECT * FROM Bike WHERE id = ?', [bikeId], (err, bike) => {
                    if (err) {
                        reject(err);
                    }                    
                    if (bike) {
                        db.get('SELECT chavePix FROM BikeDriver WHERE id = ?', [bike.idAlugador], (err, bikeDriver) => {
                            if (err) {
                                reject(err);
                            }            
                            
                            if (bikeDriver) {                               
                                resolve(bikeDriver.chavePix);
                            } else {
                                reject('Alugador não encontrado');
                            }
                        });
                    } else {
                        reject('Bicicleta não encontrada');
                    }
                });
            });

            pix.then(chave => {
                const valorBike = 5 + punicaoValor;    
                //const idPagamento = criarPagamento(bikeId, valorBike, chave);
                //validarPagamento(idPagamento);
            }).catch(err => {
                console.log(err);
            })

            
            db.run(`UPDATE BikeDriver SET punicao = 0, tempoPunicao = NULL WHERE id = ?`, [userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao atualizar o BikeDriver' });
                }
                
                alugarBicicleta(bikeId, local, userId, index, res);  
            });
        } else {           
            alugarBicicleta(bikeId, local, userId, index, res);  
        }
    });

    function alugarBicicleta(bikeId, local, userId, index, res) {      
        db.get('SELECT * FROM Bike WHERE id = ?', [bikeId], (err, bike) => {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao acessar o banco de dados' });
            }        

            if (!bike) {
                return res.status(400).json({ error: 'Bicicleta não disponível para aluguel' });
            }
    
            db.get('SELECT * FROM Bike WHERE idAlugador = ?', [userId], (err, jaEstaPedalando) => {
                if (err) {
                    return res.status(500).json({ erro: 'Erro ao acessar o banco de dados' });
                }

                if (jaEstaPedalando) {
                    return res.status(400).json({ error: 'Você já está alugando uma bicicleta' });
                }

                const dataAluguel = moment().format('YYYY-MM-DD HH:mm:ss');           
                db.run('UPDATE bike SET alugada = 1, idAlugador = ?, dataAluguel = ? WHERE id = ?',
                    [userId, dataAluguel, bikeId], function (err) {
                        if (err) {
                            return res.status(500).json({ erro: 'Erro ao atualizar o status da bicicleta' });
                        }

                        db.run(`UPDATE Mapa SET espaco_${index} = 0 WHERE local = ?`, [local], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Erro ao atualizar o mapa' });
                            }
                        });

                        return res.status(200).json({ message: 'Bicicleta alugada com sucesso!\nvocê tem 1 hora de uso, com multa de R$ 2,00 a cada 15 minutos de excesso.\nAproveite!' });
                    });
            });
        });
    }
});


control.post('/estacionar', (req, res) => {
    const { userId, local, index } = req.body;

    db.get('SELECT * FROM BikeDriver WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
        }

        if (!user.eAlugador) {  
            db.get('SELECT * FROM Bike WHERE idAlugador = ?', [userId], async (err, bike) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
                }

                if (bike) {
                    if(bike.idAlugador !== bike.idBikeDriver){
                        const dataAluguel = moment(bike.dataAluguel);
                        const tempoAluguel = moment();
                        const diferenca = tempoAluguel.diff(dataAluguel,'minutes');
                        if(diferenca > 5){                            
                            const tempoFormatado = tempoAluguel.format('YYYY-MM-DD HH:mm:ss');
                            db.run('UPDATE BikeDriver SET punicao = 1, tempoPunicao = ? WHERE id = ?', [tempoFormatado,userId], (err) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Erro ao atualizar o mapa' });
                                }
                            });
                            enviarEmail(user.usuario,user.email)
                            enviarMensagemWhatsApp(user.usuario,user.numero)
                        }
                    }  
                    atualizarEstacionamento(bike.id, local, index, res);               
                } else {                      
                    db.get(`SELECT * FROM Mapa WHERE local = ? AND espaco_${index} != 0`, [local],(err,loc) => {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
                        }
                        if(!loc){
                            db.get(`
                            SELECT * 
                            FROM Bike AS b
                            WHERE b.idBikeDriver = ? 
                                AND b.alugada = 0
                                AND NOT EXISTS (
                                    SELECT 1 
                                    FROM Mapa AS m
                                    WHERE m.espaco_1 = b.id 
                                        OR m.espaco_2 = b.id 
                                        OR m.espaco_3 = b.id 
                                        OR m.espaco_4 = b.id 
                                        OR m.espaco_5 = b.id 
                                        OR m.espaco_6 = b.id 
                                        OR m.espaco_7 = b.id 
                                        OR m.espaco_8 = b.id 
                                        OR m.espaco_9 = b.id 
                                        OR m.espaco_10 = b.id
                                )
                            LIMIT 1;
                            `, [userId], (err, bike) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
                                }
                                if (bike) {                                   
                                    db.run(`UPDATE Mapa SET espaco_${index} = ? WHERE local = ? `, [bike.id, local], (err) => {
                                        if (err) {
                                            return res.status(500).json({ error: 'Erro ao atualizar o mapa' });
                                        }
                                        return res.status(200).json({ message: 'Bicicleta estacionada com sucesso!' });
                                    });
                                } else {
                                    return res.status(404).json({ error: 'Nenhuma bicicleta disponível' });
                                }
                            })
                        }
                    })
                }
            });
        } else {           
            db.get('SELECT * FROM Bike WHERE idAlugador = ?', [userId], (err, bike) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
                }

                if (bike) {                    
                    const dataAluguel = moment(bike.dataAluguel);   
                    const tempoAluguel = moment();   
                    const diferenca = tempoAluguel.diff(dataAluguel,'minutes');

                    if(diferenca > 5){
                        const tempoFormatado = tempoAluguel.format('YYYY-MM-DD HH:mm:ss');                        
                        db.run('UPDATE BikeDriver SET punicao = 1, tempoPunicao = ? WHERE id = ?', [tempoFormatado,userId], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Erro ao atualizar o mapa' });
                            }
                        });
                        enviarEmail(user.usuario,user.email)
                        enviarMensagemWhatsApp(user.usuario,user.numero)
                    }                                  
                    atualizarEstacionamento(bike.id, local, index, res);
                }else{
                    return res.status(500).json({ error: 'Você não esta pedalando' });
                }
            });
        }
    });
});

function atualizarEstacionamento(bikeId, local, index, res) {
    const stmt = db.prepare('BEGIN TRANSACTION');
    stmt.run();

    db.run(`UPDATE Mapa SET espaco_${index} = ? WHERE local = ?`, [bikeId, local], (err) => {
        if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Erro ao atualizar o mapa' });
        }

        db.run('UPDATE Bike SET alugada = 0, dataAluguel = NULL , idAlugador = NULL WHERE id = ?', [bikeId], (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Erro ao atualizar o status da bicicleta' });
            }

            db.run('COMMIT');
            return res.status(200).json({ message: 'Bicicleta estacionada com sucesso!' });
        });
    });
}

async function enviarEmail(nome, email) {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbx6tGtbPL7tT_KVMvh5KPxcciC9jzBIF-ArAWEu06z-qRWLs6Kh4q3hoWo2W6P526fu/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: nome, email: email })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao enviar o e-mail');
        }
    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
    }
}

function enviarMensagemWhatsApp(nomeUsuario, telefone) {
    const mensagem = `Caro ${nomeUsuario}, você ultrapassou o tempo limite de uso da bicicleta alugada. 
    Por isso, contatamos os seguranças da UFRN e informamos a situação. 
    Saiba que a cada 15 minutos a mais de uso, o senhor(a) levará uma multa de 2 Reais, que será cobrada na próxima locação.`;
    
    CLIENT.messages.create({
        from: 'whatsapp:+5584988501362',  
        to: `whatsapp:+55${telefone}`,     
        body: mensagem
    })
    .then((message) => {
        console.log('Mensagem enviada com sucesso:', message.sid);
    })
    .catch((error) => {
        console.error('Erro ao enviar a mensagem:', error);
    });
}

/*
async function criarPagamento(bikeId, valor, chavePix) {
    try {
    
    const body = {
        items: [
            {
            name: 'Aluguel de bicicleta',
            value: valor * 100, 
            amount: 1,
            },
        ],
        payment: {
            method: 'pix',
        },
    };
    
    const chargeResponse = await gerencianet.createCharge({}, body);
    
    const dataCriacao = new Date().toISOString();
    const stmt = await db.prepare(`
    INSERT INTO Pagamento (bike_id, valor, chave_pix, status, data_criacao)
    VALUES (?, ?, ?, ?, ?)
    `);
    await stmt.run(bikeId, valor, chavePix, 'pendente', dataCriacao);
    await stmt.finalize();

    console.log(`Cobrança PIX criada com sucesso! ID do pagamento: ${chargeResponse.data.charge_id}`);

    return chargeResponse.data.charge_id; 
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        throw new Error('Erro ao criar cobrança PIX');
    }
}


async function validarPagamento(idpagamento){
    try{
        let pagamentoValido = false;
        let tentativas = 0;

        const log = setInterval(() => {
            const dots = '.'.repeat(tentativas % 4);
            console.log(`Esperando pagamento${dots}`);
            tentativas++;
        },10000);

        while(!pagamentoValido){
            const response = await gerencianet.getCharge({ charge_id: idpagamento });

            if(response.data.status === 'paid'){
                pagamentoValido = true;
                clearInterval(log);
                console.log('Pagamento efetuado com sucesso!');
                const stmt = await db.prepare(`UPDATE Pagamento SET status = ?, data_pagamento = ? WHERE id = ?`);
                const dataPagamento = new Date().toISOString();
                await stmt.run('pago', dataPagamento, idpagamento);
                await stmt.finalize();

                await db.run(`UPDATE Bike SET alugada = TRUE WHERE id = ?`, [response.data.items[0].id]);
                return true;
            }
            await new Promise(res => setTimeout(res, 5000));
        }
    } catch (error) {
        console.error('Erro ao validar pagamento:', error);
        throw new Error('Erro ao validar pagamento PIX');
    }
}
*/


//const idPagamento = await criarPagamento(bikeId, valor, chavePix);
//const pagamentoValido = await validarPagamento(idPagamento);

export default control;
