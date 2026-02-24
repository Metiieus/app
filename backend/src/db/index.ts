import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../../database/schema';

// Configuração da conexão com MySQL
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rpmon_dashboard',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Instância do Drizzle ORM
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Exportar schema para uso em queries
export { schema };

// Função para testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    connection.release();
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    return false;
  }
}
