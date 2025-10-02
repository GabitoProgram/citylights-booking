# 📅 CityLights Booking Microservice

Microservicio especializado en gestión de reservas y áreas comunes, construido con **NestJS + TypeScript + Prisma** y desplegado en **Railway**.

## 🎯 **¿Qué hace este microservicio?**

Es el corazón del sistema de reservas de CityLights que maneja:
- 🏊‍♀️ **Áreas comunes** (piscina, gym, salón de eventos, BBQ)
- 📅 **Sistema de reservas** con calendario inteligente
- 💳 **Pagos integrados** con Stripe
- 🔒 **Control de disponibilidad** y bloqueos
- 🧾 **Facturas automáticas** con códigos QR
- 📧 **Notificaciones** por email
- 👥 **Gestión de usuarios** y permisos

## 🏗️ **Arquitectura del Microservicio**

### **Stack Tecnológico:**
- 🚀 **NestJS** - Framework Node.js enterprise
- 📘 **TypeScript** - Tipado estático robusto
- 🗄️ **Prisma ORM** - Base de datos type-safe
- 🐘 **PostgreSQL** - Base de datos (Neon)
- 💳 **Stripe** - Procesamiento de pagos
- 📄 **Puppeteer + PDFKit** - Generación de facturas
- 📧 **Email Service** - Notificaciones automáticas
- 🔐 **JWT** - Autenticación con otros servicios

### **Modelo de Datos:**

```sql
🏢 AreaComun (Espacios reservables)
├── id, nombre, descripcion, capacidad
├── precioHora, ubicacion, imagen
├── horariosDisponibles, reglasUso
└── estado (ACTIVA/INACTIVA/MANTENIMIENTO)

📅 Reserva (Reservas de usuarios)
├── id, usuarioId, areaId
├── fechaInicio, fechaFin, estado
├── motivo, observaciones
└── fechaCreacion, fechaActualizacion

💳 PagoReserva (Pagos de reservas)
├── id, reservaId, monto, estado
├── metodoPago, stripePaymentId
├── fechaPago, numeroTransaccion
└── comprobante, hash

🧾 Factura (Documentos generados)
├── id, reservaId, numeroFactura
├── fechaEmision, monto, estado
├── rutaArchivo, qrCode
└── hash, fechaEnvio

🔒 Bloqueo (Mantenimiento/Eventos)
├── id, areaId, fechaInicio, fechaFin
├── motivo, tipoBloqueo
└── usuarioCreador, observaciones

📋 Confirmacion (Validaciones)
├── id, reservaId, codigo
├── fechaExpiracion, estado
└── intentosValidacion
```

## 📁 **Estructura del Proyecto**

```
src/
├── 📁 booking/              # 🏢 Áreas Comunes
│   ├── booking.controller.ts
│   ├── booking.service.ts
│   ├── booking.module.ts
│   └── dto/
│
├── 📁 reserva/              # 📅 Reservas
│   ├── reserva.controller.ts
│   ├── reserva.service.ts
│   ├── reserva.module.ts
│   └── dto/
│
├── 📁 pago-reserva/         # 💳 Pagos
│   ├── pago-reserva.controller.ts
│   ├── pago-reserva.service.ts
│   ├── pago-reserva.module.ts
│   └── dto/
│
├── 📁 stripe/               # 💎 Integración Stripe
│   ├── stripe.controller.ts
│   ├── stripe.service.ts
│   └── stripe.module.ts
│
├── 📁 factura/              # 🧾 Facturas
│   ├── factura.controller.ts
│   ├── factura.service.ts
│   └── factura.module.ts
│
├── 📁 bloqueo/              # 🔒 Bloqueos/Mantenimiento
│   ├── bloqueo.controller.ts
│   ├── bloqueo.service.ts
│   └── bloqueo.module.ts
│
├── 📁 confirmacion/         # ✅ Validaciones
│   ├── confirmacion.controller.ts
│   ├── confirmacion.service.ts
│   └── confirmacion.module.ts
│
├── 📁 auditoria/            # 📊 Logs y Auditoría
│   ├── auditoria.service.ts
│   └── auditoria.module.ts
│
├── 📁 auth/                 # 🔐 Autenticación
│   ├── auth.guard.ts
│   ├── jwt.strategy.ts
│   └── auth.module.ts
│
└── 📁 main.ts               # 🚀 Punto de entrada
```

## 🔧 **Instalación y Desarrollo**

### **Prerrequisitos:**
- 📦 **Node.js** >= 16
- 🐘 **PostgreSQL** (local o Neon)
- 💳 **Cuenta Stripe** (para pagos)
- 🔑 **Variables de entorno**

### **Variables de Entorno (.env):**
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@host:5432/citylights_booking_db"

# Puerto del servicio
PORT=3001

# JWT para comunicación entre servicios
JWT_SECRET="tu_secret_super_seguro"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLIC_KEY="pk_test_..."

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-password"

# Configuración de archivos
UPLOAD_DIR="./facturas"
```

### **Instalación paso a paso:**

```bash
# 1. Clonar y navegar
cd booking-service - copia

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
npx prisma generate
npx prisma db push

# 4. Ejecutar en desarrollo
npm run start:dev

# 5. Servicio disponible en:
# http://localhost:3001
```

### **Scripts disponibles:**
```bash
npm run start:dev     # Desarrollo con hot-reload
npm run build         # Build de producción + DB setup
npm run start:prod    # Producción
npm run deploy        # Deploy completo con DB
npm run prisma:studio # GUI para base de datos
```

## 🌐 **API Endpoints**

### **🔐 Autenticación:**
Todos los endpoints requieren JWT token en el header:
```http
Authorization: Bearer {jwt_token}
```

### **🏢 Gestión de Áreas Comunes:**

#### **📋 Listar Áreas Comunes**
```http
GET /booking/areas-comunes
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Piscina Principal",
    "descripcion": "Piscina climatizada para adultos",
    "capacidad": 50,
    "precioHora": 25000,
    "ubicacion": "Planta baja",
    "imagen": "https://...",
    "estado": "ACTIVA",
    "horariosDisponibles": ["09:00-22:00"]
  }
]
```

#### **➕ Crear Área Común (Admin)**
```http
POST /booking/areas-comunes
Content-Type: application/json

{
  "nombre": "Salón de Eventos",
  "descripcion": "Salón para celebraciones",
  "capacidad": 100,
  "precioHora": 80000,
  "ubicacion": "Segundo piso",
  "horariosDisponibles": ["08:00-23:00"],
  "reglasUso": "No fumar, máximo 100 personas"
}
```

#### **✏️ Actualizar Área Común**
```http
PUT /booking/areas-comunes/{id}
```

#### **🗑️ Eliminar/Desactivar Área**
```http
DELETE /booking/areas-comunes/{id}
```

### **📅 Gestión de Reservas:**

#### **📋 Mis Reservas**
```http
GET /reservas/mis-reservas
Authorization: Bearer {user_token}
```

#### **📋 Todas las Reservas (Admin)**
```http
GET /reservas
Authorization: Bearer {admin_token}
```

#### **➕ Crear Reserva**
```http
POST /reservas
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "areaId": 1,
  "fechaInicio": "2025-10-15T10:00:00Z",
  "fechaFin": "2025-10-15T12:00:00Z",
  "motivo": "Cumpleaños familiar",
  "observaciones": "Será una celebración tranquila"
}
```

**Respuesta:**
```json
{
  "id": 123,
  "areaId": 1,
  "usuarioId": 456,
  "fechaInicio": "2025-10-15T10:00:00Z",
  "fechaFin": "2025-10-15T12:00:00Z",
  "estado": "PENDING",
  "motivo": "Cumpleaños familiar",
  "montoTotal": 50000,
  "area": {
    "nombre": "Piscina Principal",
    "precioHora": 25000
  }
}
```

#### **✏️ Actualizar Reserva**
```http
PUT /reservas/{id}
```

#### **❌ Cancelar Reserva**
```http
DELETE /reservas/{id}
```

#### **✅ Confirmar Reserva (Admin)**
```http
PATCH /reservas/{id}/confirmar
```

### **💳 Gestión de Pagos:**

#### **💎 Crear Intención de Pago (Stripe)**
```http
POST /pago-reserva/create-payment-intent
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "reservaId": 123,
  "monto": 50000,
  "metodoPago": "TARJETA_CREDITO"
}
```

**Respuesta:**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890",
  "monto": 50000,
  "currency": "cop"
}
```

#### **✅ Confirmar Pago**
```http
POST /pago-reserva/confirm-payment
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "reservaId": 123
}
```

#### **📋 Historial de Pagos**
```http
GET /pago-reserva/mis-pagos
Authorization: Bearer {user_token}
```

#### **🧾 Webhook de Stripe**
```http
POST /stripe/webhook
Stripe-Signature: {stripe_signature}
```

### **🔒 Gestión de Bloqueos:**

#### **📋 Listar Bloqueos**
```http
GET /bloqueos
```

#### **➕ Crear Bloqueo (Admin)**
```http
POST /bloqueos
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "areaId": 1,
  "fechaInicio": "2025-10-20T09:00:00Z",
  "fechaFin": "2025-10-20T17:00:00Z",
  "motivo": "Mantenimiento de piscina",
  "tipoBloqueo": "MANTENIMIENTO"
}
```

#### **🗑️ Eliminar Bloqueo**
```http
DELETE /bloqueos/{id}
```

### **🧾 Gestión de Facturas:**

#### **📄 Generar Factura**
```http
POST /facturas/generar
Content-Type: application/json

{
  "reservaId": 123,
  "pagoId": 456
}
```

#### **📥 Descargar Factura**
```http
GET /facturas/{id}/download
```

#### **📧 Enviar Factura por Email**
```http
POST /facturas/{id}/enviar-email
```

## 💳 **Integración con Stripe**

### **🔧 Configuración:**
```javascript
// Frontend - Procesar pago
const stripe = Stripe('pk_test_...');

// 1. Crear Payment Intent
const response = await fetch('/api/proxy/booking/pago-reserva/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reservaId: 123,
    monto: 50000
  })
});

const { clientSecret } = await response.json();

// 2. Confirmar pago
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Usuario'
    }
  }
});

if (result.error) {
  console.error('Error en pago:', result.error);
} else {
  console.log('Pago exitoso:', result.paymentIntent);
}
```

### **🔄 Webhooks:**
```javascript
// Eventos manejados:
- payment_intent.succeeded ✅
- payment_intent.payment_failed ❌
- charge.dispute.created 🔍
```

## 📧 **Sistema de Notificaciones**

### **📬 Emails Automáticos:**
- ✅ **Reserva creada** → Confirmación al usuario
- ✅ **Pago exitoso** → Comprobante con factura
- ✅ **Reserva confirmada** → Detalles finales
- ✅ **Recordatorio** → 24h antes del evento
- ❌ **Cancelación** → Notificación y reembolso

### **📱 Plantillas HTML:**
```html
📧 Email de Confirmación:
- Datos de la reserva
- Información del área común
- Instrucciones de pago
- Código QR de confirmación

🧾 Email de Factura:
- Factura PDF adjunta
- Detalles del pago
- Información fiscal
- Código de verificación
```

## 🔐 **Seguridad y Permisos**

### **👥 Roles de Usuario:**

| Rol | Permisos |
|-----|----------|
| **USER_CASUAL** | Ver áreas, crear/ver sus reservas, pagar |
| **USER_ADMIN** | Gestionar todas las reservas, confirmar reservas |
| **SUPER_USER** | Acceso total, crear áreas, bloqueos, reportes |

### **🛡️ Validaciones:**
- 🔐 **JWT Authentication** en todos los endpoints
- ⏰ **Validación de horarios** disponibles
- 💰 **Verificación de pagos** con Stripe
- 📅 **Control de solapamiento** de reservas
- 🚫 **Prevención de reservas** en áreas bloqueadas

## 🚀 **Deploy en Railway**

### **🌐 URL de Producción:**
```
https://citylights-booking-production.up.railway.app
```

### **📊 Estado del Servicio:**
- ✅ **24/7 Disponible**
- ✅ **Auto-scaling**
- ✅ **Base de datos Neon**
- ✅ **Stripe configurado**
- ✅ **SSL/HTTPS**

### **🔧 Deploy Manual:**
```bash
# Build y deploy
npm run build
npm run deploy

# Railway CLI
railway login
railway up
```

## 💡 **Casos de Uso**

### **🏊‍♀️ Para Usuarios (Residentes):**
1. **Ver áreas disponibles** → GET `/booking/areas-comunes`
2. **Crear reserva** → POST `/reservas`
3. **Pagar reserva** → POST `/pago-reserva/create-payment-intent`
4. **Ver mis reservas** → GET `/reservas/mis-reservas`

### **🛡️ Para Administradores:**
1. **Gestionar áreas comunes** → CRUD en `/booking/areas-comunes`
2. **Confirmar reservas** → PATCH `/reservas/{id}/confirmar`
3. **Crear bloqueos** → POST `/bloqueos`
4. **Ver todas las reservas** → GET `/reservas`

### **📱 Ejemplo de Integración:**
```javascript
// Cliente JavaScript completo
const bookingAPI = {
  baseURL: 'https://citylights-booking-production.up.railway.app',
  
  async getAreasComunes(token) {
    const response = await fetch(`${this.baseURL}/booking/areas-comunes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },
  
  async crearReserva(reservaData, token) {
    const response = await fetch(`${this.baseURL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reservaData)
    });
    return response.json();
  },
  
  async pagarReserva(pagoData, token) {
    const response = await fetch(`${this.baseURL}/pago-reserva/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pagoData)
    });
    return response.json();
  }
};

// Uso práctico
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 1. Ver áreas disponibles
const areas = await bookingAPI.getAreasComunes(token);
console.log('Áreas disponibles:', areas);

// 2. Crear reserva
const nuevaReserva = await bookingAPI.crearReserva({
  areaId: 1,
  fechaInicio: '2025-10-15T10:00:00Z',
  fechaFin: '2025-10-15T12:00:00Z',
  motivo: 'Cumpleaños'
}, token);

// 3. Procesar pago
const pago = await bookingAPI.pagarReserva({
  reservaId: nuevaReserva.id,
  monto: 50000
}, token);
```

## 🔧 **Troubleshooting**

### **❌ Problemas Comunes:**

1. **Error de conexión DB:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Stripe no funciona:**
   - Verificar `STRIPE_SECRET_KEY` en `.env`
   - Confirmar webhooks en Dashboard de Stripe
   - Verificar endpoint webhook: `/stripe/webhook`

3. **Reservas se solapan:**
   - Verificar lógica de validación en `reserva.service.ts`
   - Revisar bloqueos activos

4. **PDFs no se generan:**
   - Verificar dependencias: `npm install puppeteer pdfkit`
   - Permisos de escritura en `/facturas`

5. **JWT inválido:**
   - Verificar `JWT_SECRET` coincide con Login service
   - Token no expirado

## 📊 **Monitoreo**

### **🔍 Logs importantes:**
```bash
# Ver logs de la aplicación
npm run start:dev

# Logs de base de datos
npx prisma studio

# Logs de Railway
railway logs

# Logs de Stripe
# Dashboard → Logs → Webhook endpoints
```

### **📈 Métricas a vigilar:**
- 🚀 **Tiempo de respuesta** < 500ms
- 💾 **Uso de memoria** < 512MB
- 🗄️ **Conexiones DB** < 15 concurrentes
- 💳 **Transacciones Stripe** exitosas > 95%
- 📧 **Emails enviados** sin errores

## 🤝 **Integración con otros servicios**

### **🔗 Conexiones:**
- **🌐 Gateway:** Proxy y enrutamiento
- **🔐 Login:** Verificación JWT y usuarios
- **💰 Nómina:** Datos de ingresos para reportes

### **📡 Comunicación:**
```
Frontend → Gateway → Booking Service
   ↓         ↓           ↓
 Usuario → JWT Token → Database
                ↓
            Stripe API
```

## 📄 **Licencia**

MIT License - Sistema CityLights

## 👨‍💻 **Desarrollador**

**Gabriel (GabitoProgram)**
- 🐙 GitHub: [@GabitoProgram](https://github.com/GabitoProgram)
- 📧 Email: [contacto]

---

⚡ **Microservicio de reservas empresarial listo para producción** ⚡
