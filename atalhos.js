/*
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
CREATE TABLE IF NOT EXISTS Bike (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    idBikeDriver INTEGER,
                    dataAluguel TEXT,
                    alugada BOOLEAN,
                    idAlugador INTEGER,
                    statusPagamento TEXT,
                    FOREIGN KEY (idAlugador) REFERENCES BikeDriver(id),
                    FOREIGN KEY (idBikeDriver) REFERENCES BikeDriver(id)
CREATE TABLE IF NOT EXISTS BikeDriver (
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
CREATE TABLE IF NOT EXISTS Pagamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idBike INTEGER NOT NULL,
        idAlugador INTEGER NOT NULL,
        chavePix TEXT NOT NULL,
        valor REAL NOT NULL,
        status TEXT NOT NULL,
        dataPagamento TEXT,                       
        FOREIGN KEY (idBike) REFERENCES Bike(id),
        FOREIGN KEY (idAlugador) REFERENCES BikeDriver(id)
*/

/*
const twilio = require('twilio'); // Importa o Twilio
const moment = require('moment');
const { db } = require('./db'); // Ajuste conforme seu módulo de banco de dados

const SID_TWILIO = 'seu_sid_do_twilio'; // SID da sua conta Twilio
const AUTH_TOKEN_TWILIO = 'seu_auth_token'; // Token da sua conta Twilio
const FROM_WHATSAPP = 'whatsapp:+1415XXXXXXX'; // Seu número do WhatsApp Twilio
const TO_WHATSAPP = 'whatsapp:+5591XXXXXXXX'; // Número de segurança no WhatsApp

const client = new twilio(SID_TWILIO, AUTH_TOKEN_TWILIO); // Cria a instância Twilio

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
                        if(diferenca > 60){ 
                            // Atualizando a punição no banco de dados
                            const tempoFormatado = tempoAluguel.format('YYYY-MM-DD HH:mm:ss');
                            db.run('UPDATE BikeDriver SET punicao = 1, tempoPunicao = ? WHERE id = ?', [tempoFormatado,userId], (err) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Erro ao atualizar a punição' });
                                }
                            });

                            // Enviando mensagem via WhatsApp
                            const mensagem = `Atenção! O usuário ${user.usuario} não devolveu a bicicleta a tempo. 
                                              Dados do usuário: 
                                              - ID: ${user.id} 
                                              - Usuário: ${user.usuario} 
                                              - Tempo de aluguel: ${dataAluguel.format('YYYY-MM-DD HH:mm:ss')} 
                                              - Tempo de atraso: ${diferenca} minutos.`;
                            client.messages.create({
                                body: mensagem,
                                from: FROM_WHATSAPP,
                                to: TO_WHATSAPP,
                            }).then((message) => {
                                console.log('Mensagem enviada: ', message.sid);
                            }).catch((err) => {
                                console.error('Erro ao enviar mensagem:', err);
                            });
                        }
                    }  
                }
            });
        }
    });
});
*/