const express = require('express');
const cors = require('cors');
const mapRoutes = require('./routes/mapRoutes');

const app = express();
const PORT = 3333;


app.use(cors());
app.use(express.json());


app.use('/mapas', mapRoutes);


app.get('/', (_req: any, res: any) => {
  res.send('API do Mapeamento de Galpão está no ar!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});