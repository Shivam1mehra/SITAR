const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'sitar_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sitar_db',
  password: process.env.DB_PASSWORD || 'sitar_password',
  port: process.env.DB_PORT || 5432,
});

const createTables = async () => {
  console.log('🗄️  Starting database migration...');

  try {
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Tourists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tourists (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        blockchain_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        nationality VARCHAR(100) NOT NULL,
        emergency_contacts JSONB DEFAULT '[]',
        privacy_settings JSONB DEFAULT '{"shareLocation": true, "shareProfile": false}',
        verification_level VARCHAR(50) DEFAULT 'basic',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tourists table created');

    // Police officers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS police_officers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        badge_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        station_id UUID,
        rank VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Police officers table created');

    // Police stations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS police_stations (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(20),
        email VARCHAR(255),
        jurisdiction_area JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Police stations table created');

    // Location updates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS location_updates (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tourist_id UUID REFERENCES tourists(id),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(8, 2),
        speed DECIMAL(8, 2),
        heading DECIMAL(8, 2),
        altitude DECIMAL(8, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'mobile_app'
      )
    `);
    console.log('✅ Location updates table created');

    // Emergency alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_alerts (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tourist_id UUID REFERENCES tourists(id),
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'high',
        status VARCHAR(50) DEFAULT 'active',
        location JSONB NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        acknowledged_by UUID REFERENCES police_officers(id),
        acknowledged_at TIMESTAMP,
        resolved_by UUID REFERENCES police_officers(id),
        resolved_at TIMESTAMP,
        response_data JSONB,
        blockchain_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Emergency alerts table created');

    // Geofences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS geofences (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        coordinates JSONB NOT NULL,
        radius DECIMAL(10, 2),
        description TEXT,
        safety_level VARCHAR(50) DEFAULT 'medium',
        active_hours JSONB,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES police_officers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Geofences table created');

    // AI predictions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_predictions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tourist_id UUID REFERENCES tourists(id),
        prediction_type VARCHAR(100) NOT NULL,
        risk_score DECIMAL(5, 4),
        confidence_level DECIMAL(5, 4),
        factors JSONB,
        model_version VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ AI predictions table created');

    // Incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        alert_id UUID REFERENCES emergency_alerts(id),
        incident_number VARCHAR(100) UNIQUE,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_officers JSONB DEFAULT '[]',
        location JSONB NOT NULL,
        description TEXT,
        actions_taken TEXT,
        outcome VARCHAR(100),
        evidence JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP
      )
    `);
    console.log('✅ Incidents table created');

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tourists_blockchain_id ON tourists(blockchain_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tourists_phone ON tourists(phone)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_location_updates_tourist_id ON location_updates(tourist_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_location_updates_timestamp ON location_updates(timestamp DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type)');
    console.log('✅ Database indexes created');

    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Apply updated_at trigger to relevant tables
    await pool.query(`
      CREATE TRIGGER update_tourists_updated_at
        BEFORE UPDATE ON tourists
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      CREATE TRIGGER update_police_officers_updated_at
        BEFORE UPDATE ON police_officers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Triggers created');
    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  createTables();
}

module.exports = { createTables };
