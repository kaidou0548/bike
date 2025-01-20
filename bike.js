import express from 'express';
import path from 'path';
import session from 'express-session';
import bikeRoutes from './src/router/bikeRouter.js';
import control from './src/controllers/bikeController.js';
import db from './src/database/database.js';
const router = express.Router();
const app = express(); 
const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/(?!\/)/, '');

app.use(session({
    secret: 'seu_segredo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'public','views'));

app.use("/api/bikes", bikeRoutes);
app.use("/control/bikes", control);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
    res.render('bike'); 
});

app.get('/pagamento', (req, res) => {
    res.render('pagamento'); 
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro');  
});

app.get('/mapa', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    class Local {
        constructor(mapa) {
            this.mapa = mapa;
            this.cor = '';
            this.contQTD = 0;
            this.contBikeUser = 0;
        }
    }

    class Mapa {
        constructor(local) {
            this.local = new Local(local);
            this.alugador = true;
        }
    }

    let mapa = [
        new Mapa("Reitoria"),
        new Mapa("CT"),
        new Mapa("RU_Central"),
        new Mapa("CCHLA")
    ];

    try {        
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM BikeDriver WHERE id = ?', [req.session.userId], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject('Usuario não encontrado');
                resolve(row);
            });
        });

        mapa.forEach(mapaInstance => {
            mapaInstance.alugador = row.eAlugador;
        });

        async function updateLocalCor(local) {

            const map = await new Promise((resolve, reject) => {
                db.get(`SELECT * FROM Mapa WHERE local = ?`, [local.mapa], (err, mapas) => {
                    if (err) return reject(err);
                    resolve(mapas);
                });
            });
            
            for (let i = 1; i <= 10; i++) {
                if (map[`espaco_${i}`] > 0) {
                    local.contQTD++;
                    if (!row.eAlugador) {                       
                        const bikes = await new Promise((resolve, reject) => {
                            db.all(`SELECT * FROM Bike WHERE idBikeDriver = ?`, [req.session.userId], (err, bikes) => {
                                if (err) return reject(err);
                                resolve(bikes);
                            });
                        });

                        bikes.map(bike => {
                            if (bike.id == map[`espaco_${i}`]) {
                                local.contBikeUser++;
                            }
                        });
                    }
                }
            }
            
            if (!row.eAlugador) {
                if (local.contQTD === 10 && local.contBikeUser > 0) {
                    local.cor = "bg-purple-400";
                }
                if (local.contQTD < 10 && local.contQTD > 0 && local.contBikeUser > 0) {
                    local.cor = "bg-violet-500";
                }
                if (local.contQTD === 10 && local.contBikeUser === 0) {
                    local.cor = "bg-green-500";
                }
                if (local.contQTD > 0 && local.contQTD < 10 && local.contBikeUser === 0) {
                    local.cor = "bg-blue-500";
                }
                if (local.contQTD === 0) {
                    local.cor = "bg-red-500";
                }
            } else {
                if (local.contQTD === 10) {
                    local.cor = "bg-green-500";
                }
                if (local.contQTD === 0) {
                    local.cor = "bg-red-500";
                }
                if (local.contQTD > 0 && local.contQTD < 10) {
                    local.cor = "bg-blue-500";
                }
            }
            
            local.contQTD = 0;
            local.contBikeUser = 0;
        }        
        await Promise.all(mapa.map(async (mapaInstance) => {
            await updateLocalCor(mapaInstance.local);
        }));
        
        res.render('mapa', { mapa: mapa });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao acessar os dados do usuário ou banco de dados '+ ' '+ db + ' '+ err });
    }
});




app.get('/ponto', (req, res) => {
    if(!req.session.userId){
        return res.redirect('/');
    }
    res.render('bikePonto');  
});

app.get('/logout' , (req, res) => {

    req.session.destroy((err) => {
        if(err){
            return res.status(500).json({error: 'Erro ao tentar deslogar'})
        }
        res.redirect('/');
    })
})

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});