# 🎓 Faculty Workload Management Platform

**O'quv yuki boshqaruv platformasi** — Institut va universitetlar uchun ishlab chiqilgan to'liq funksional veb-ilova. Universitet o'qituvchilarining o'quv yuki, semestр rejalari, vakansiya tahlili va davlat hisoboti formatlarini boshqaradi.

> **Stack:** Node.js · Express · Prisma · PostgreSQL · React · TypeScript · TailwindCSS

---

## 📋 Mundarija

- [Loyiha haqida](#-loyiha-haqida)
- [Asosiy imkoniyatlar](#-asosiy-imkoniyatlar)
- [Rollar tizimi](#-rollar-tizimi)
- [Texnologiyalar](#-texnologiyalar)
- [Ma'lumotlar bazasi](#-malumotlar-bazasi-modellari)
- [O'rnatish va ishga tushirish](#-ornatish-va-ishga-tushirish)
- [API endpointlar](#-api-endpointlar)
- [Loyiha tuzilmasi](#-loyiha-tuzilmasi)
- [Skrinshot](#-skrinshot)

---

## 📌 Loyiha haqida

Bu platforma universitet ma'muriyatiga va kafedra mudirlariga quyidagilarni amalga oshirish imkonini beradi:

- O'qituvchilar o'quv yukini **avtomatik hisoblash** va monitoring qilish
- Semestrlar bo'yicha **dars rejalarini** tuzish va o'qituvchilarga topshiriq berish
- **Davlat hisoboti** formatlarida (Kafedra Yuklama, Shtat Birligi) Excel eksporti
- **Vakansiya tahlili** — qoplanmagan soatlar va kerakli shtat birligi hisoblash
- O'qituvchilarning **so'rovlarini** online yuborish va ko'rib chiqish
- **Excel orqali ommaviy import** (o'qituvchilar va fanlar katalogi)
- **3 tilda interfeys**: O'zbek, Русский, English

---

## ✨ Asosiy imkoniyatlar

### 🔐 Autentifikatsiya
- JWT (Access + Refresh token, HttpOnly cookie)
- Rol asosida kirish huquqi (RBAC)
- Parolni yangilash imkoniyati

### 👨‍💼 Admin paneli
| Sahifa | Tavsif |
|--------|--------|
| Dashboard | Statistika, grafik, tezkor ma'lumotlar |
| O'qituvchilar | Ro'yxat, qidirish, faollashtirish/bloklash, **Excel import** |
| Fanlar katalogi | Fan qo'shish/tahrirlash, ECTS, soatlar bo'yicha turlash, **Excel import** |
| Dasturlar | Ta'lim dasturlari va o'quv rejalari (Curriculum) |
| Semestrlar | Semestr yaratish, hafta soni, akademik yil |
| Talabalar guruhlari | Guruh va yil bo'yicha boshqarish |
| Xonalar | Auditoriya fondi |
| O'quv yuki topshirish | Admin tomonidan to'g'ridan-to'g'ri tayinlash |
| Vakansiya tahlili | Bo'lim bo'yicha qoplanmagan soatlar, progress bar, staff hisoblash |
| Hisobotlar | Excel eksporti (Workload Summary, Overload, Dept Comparison, Kafedra Yuklama, Shtat Birligi, Vacancy Forecast) |
| So'rovlar | O'qituvchi so'rovlarini ko'rib chiqish |
| CQI ko'rib chiqish | Kurs sifat ko'rsatkichlari |

### 🏫 Kafedra mudiri paneli
| Sahifa | Tavsif |
|--------|--------|
| Dashboard | Kafedra statistikasi |
| Semestr rejasi | Planning row yaratish, o'qituvchilarga topshiriq berish, real-time overload warning |
| Bo'lim yuki | Kafedra bo'yicha yuk taqsimoti |
| So'rovlarni ko'rish | O'qituvchi arizalarini ko'rib chiqish va qaror qabul qilish |
| CQI | Kurs sifatini baholash |

### 👨‍🏫 O'qituvchi paneli
| Sahifa | Tavsif |
|--------|--------|
| Dashboard | Shaxsiy statistika, haftalik yuk grafigi |
| Mening yukimreturn | Tayinlangan fanlar ro'yxati, soatlar |
| So'rov yuborish | Qo'shimcha yuk yoki taklif so'rovi |
| Mening so'rovlarim | So'rovlar tarixi va holati |

### 📊 Hisobot tizimi
- **Workload Summary** — barcha o'qituvchilar yuki
- **Overload Report** — me'yordan oshgan o'qituvchilar
- **Department Comparison** — kafedra-kafedra taqqoslash
- **Kafedra Yuklama** — O'zbekiston davlat standarti bo'yicha (Times New Roman, 29 ustun)
- **Shtat Birligi** — kafedra shtat birligi hisob-kitobi
- **Vacancy Forecast** — vakansiya bashorat hisoboti

### 📥 Excel Import
Ommaviy import qilish uchun:
- **O'qituvchilar**: `employeeId`, `lastName`, `firstName`, `email`, `department`, `position`, `degree`, `employmentType`, `maxWeeklyHours`
- **Fanlar**: `courseCode`, `title`, `type`, `credits`, `weeklyLectureHours`, `weeklyTutorialHours`, `weeklyLabHours`, `department`

Xususiyatlar:
- Header qatorni avtomatik aniqlash (UZ/RU/EN ustun nomlari)
- Bo'lim nomini noaniq moslashtirish (fuzzy match)
- Lavozimni ko'p tilli tanib olish (UZ + RU + EN)
- Upsert mantiq — mavjud bo'lsa yangilaydi, yo'q bo'lsa yaratadi

---

## 👥 Rollar tizimi

```
ADMIN           → To'liq kirish
DEPARTMENT_HEAD → Kafedra boshqaruvi + rejalashtirish
FACULTY         → O'z yukini ko'rish + so'rov yuborish
```

---

## 🛠 Texnologiyalar

### Backend
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| Node.js | 20+ | Server muhit |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Tip xavfsizligi |
| Prisma | 5.x | ORM + migrations |
| PostgreSQL | 16 | Asosiy ma'lumotlar bazasi |
| Redis | 7 | Session / cache (optional) |
| ExcelJS | 4.x | Excel yaratish va o'qish |
| Zod | 3.x | Input validation |
| JWT | — | Autentifikatsiya |
| Multer | 1.x | Fayl yuklash |
| bcryptjs | — | Parol shifrlash |

### Frontend
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Tip xavfsizligi |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Stil |
| TanStack Query | 5.x | Server state |
| React Hook Form | 7.x | Formalar |
| Zustand | 4.x | Global state |
| Recharts | 2.x | Grafiklar |
| i18next | — | Ko'p til |
| Axios | 1.x | HTTP client |
| Lucide React | — | Ikonalar |

---

## 🗄 Ma'lumotlar bazasi modellari

```
Department        — Kafedra (avgWeeklyLoad, code, name)
User              — Foydalanuvchi (ADMIN | DEPT_HEAD | FACULTY)
Course            — Fan (weeklyLectureHours, weeklyTutorialHours, weeklyLabHours)
Semester          — Semestr (weekCount, academicYear)
Program           — Ta'lim dasturi
Curriculum        — O'quv reja
CurriculumItem    — Fandagi yil/semestr
PlanningRow       — Kafedra mudir rejasi (lectureGroups, tutorialGroups, labGroups)
WorkloadAssignment— Mudir tomonidan tayinlash
WorkloadRecord    — Admin tomonidan to'g'ridan-to'g'ri tayinlash (legacy)
VacancyRecord     — Vakansiya tahlil natijasi
StaffUnit         — Shtat birligi hisob-kitobi
Group             — Talabalar guruhi
StudentCohort     — Yil bo'yicha kohort
Room              — Auditoriya
Request           — O'qituvchi so'rovi
Notification      — Tizim xabarlari
Report            — Yaratilgan hisobotlar
CQIReport         — Kurs sifat indikatori
CourseObjective   — CLO (Course Learning Outcomes)
AuditLog          — Audit jurnali
```

---

## 🚀 O'rnatish va ishga tushirish

### Talablar
- Node.js ≥ 20
- PostgreSQL 16
- Redis 7 *(ixtiyoriy)*
- Docker & Docker Compose *(ixtiyoriy)*

---

### 1️⃣ Repozitoriyni klonlash

```bash
git clone https://github.com/Xronuz/workload-institut.git
cd workload-institut
```

---

### 2️⃣ Ma'lumotlar bazasini ishga tushirish (Docker)

```bash
docker-compose up -d
```

Bu PostgreSQL (port 5432) va Redis (port 6379) ni ishga tushiradi.

---

### 3️⃣ Backend sozlash

```bash
cd backend
npm install
```

`.env` fayl yarating:

```env
DATABASE_URL="postgresql://workload_user:workload_pass@localhost:5432/workload_db"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

EMAIL_FROM="noreply@university.uz"
UPLOAD_DIR="./uploads"
COOKIE_SECRET="your-cookie-secret"
```

```bash
# Migratsiya va seed
npx prisma migrate dev
npx prisma db seed

# Dev server
npm run dev
```

Backend `http://localhost:3000` da ishga tushadi.

---

### 4️⃣ Frontend sozlash

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` da ishga tushadi.

---

### 5️⃣ Kirish ma'lumotlari (seed dan)

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | `admin@university.uz` | `Admin123!` |
| Kafedra mudiri | `head@university.uz` | `Head123!` |
| O'qituvchi | `faculty@university.uz` | `Faculty123!` |

---

## 📡 API Endpointlar

```
POST   /api/auth/login           — Tizimga kirish
POST   /api/auth/logout          — Chiqish
POST   /api/auth/refresh         — Token yangilash

GET    /api/users                — Foydalanuvchilar ro'yxati
POST   /api/users                — Yangi foydalanuvchi
PUT    /api/users/:id            — Yangilash

GET    /api/departments          — Kafedra ro'yxati
POST   /api/departments          — Kafedra qo'shish
PUT    /api/departments/:id      — Kafedra tahrirlash

GET    /api/courses              — Fanlar katalogi
POST   /api/courses              — Fan qo'shish

GET    /api/semesters            — Semestrlar
POST   /api/semesters            — Semestr yaratish

GET    /api/planning             — Rejalashtirish qatorlari
POST   /api/planning             — Yangi qator
POST   /api/planning/:id/submit  — Tasdiqlash uchun yuborish

GET    /api/workload-assignments             — Topshiriqlar
POST   /api/workload-assignments             — Tayinlash
PUT    /api/workload-assignments/:id         — Yangilash
DELETE /api/workload-assignments/:id         — O'chirish

GET    /api/vacancy/:semesterId              — Vakansiya tahlili
POST   /api/vacancy/:semesterId/calculate    — Qayta hisoblash

GET    /api/staff-units/:semesterId          — Shtat birligi
POST   /api/staff-units/recalculate          — Qayta hisoblash

POST   /api/reports/generate                 — Hisobot yaratish
GET    /api/reports                          — Hisobotlar ro'yxati

POST   /api/import/faculty                   — O'qituvchilarni Excel'dan import
POST   /api/import/courses                   — Fanlarni Excel'dan import

GET    /api/dashboard/admin                  — Admin statistika
GET    /api/dashboard/head                   — Kafedra mudiri statistika
GET    /api/dashboard/faculty                — O'qituvchi statistika
```

---

## 📁 Loyiha tuzilmasi

```
workload-institut/
├── docker-compose.yml
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 23 ta model
│   │   └── seed.ts                # Test ma'lumotlar
│   └── src/
│       ├── config/                # DB, constants
│       ├── middleware/            # auth, authorize, validate, errorHandler
│       ├── utils/                 # ApiError, helpers
│       └── modules/
│           ├── auth/              # Login, logout, refresh
│           ├── users/             # CRUD + role management
│           ├── departments/       # Kafedra + avgWeeklyLoad
│           ├── courses/           # Fan katalogi
│           ├── semesters/         # Semestr boshqaruvi
│           ├── programs/          # Ta'lim dasturlari
│           ├── curriculum/        # O'quv rejalar
│           ├── planning/          # PlanningRow (kafedra rejasi)
│           ├── workload-assignments/ # O'qituvchi tayiniqlari + StaffUnit trigger
│           ├── workloads/         # Admin to'g'ridan tayinlash (legacy)
│           ├── vacancy/           # Vakansiya hisoblash
│           ├── staff-units/       # Shtat birligi hisob-kitobi
│           ├── import/            # Excel bulk import
│           ├── reports/           # Excel hisobotlar + generator
│           ├── dashboard/         # Rol bo'yicha statistika
│           ├── requests/          # O'qituvchi so'rovlari
│           ├── notifications/     # Tizim xabarlari
│           ├── groups/            # Talabalar guruhlari
│           ├── student-cohorts/   # Yillik kohortlar
│           ├── rooms/             # Auditoriyalar
│           ├── cqi/               # Kurs sifat indikatori
│           └── course-objectives/ # CLO boshqaruvi
│
└── frontend/
    └── src/
        ├── api/                   # Axios client + API funksiyalar
        ├── components/
        │   └── shared/            # StatusBadge, ImportModal, LanguageSwitcher
        ├── i18n/
        │   └── locales/           # en.json, uz.json, ru.json
        ├── pages/
        │   ├── admin/             # 13 ta sahifa
        │   ├── department-head/   # 5 ta sahifa
        │   └── faculty/           # 4 ta sahifa
        └── store/                 # Zustand auth store
```

---

## 📊 Tizim arxitekturasi

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                  │
│  Admin Panel  │  Dept Head Panel  │  Faculty Panel  │
└─────────────────────┬───────────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────▼───────────────────────────────┐
│              BACKEND (Express + Prisma)             │
│  Auth  │  Planning  │  Reports  │  Import  │  etc.  │
└────────┬──────────────────────────────┬─────────────┘
         │                              │
    ┌────▼────┐                   ┌─────▼─────┐
    │PostgreSQL│                   │   Redis   │
    │  (data)  │                   │  (cache)  │
    └──────────┘                   └───────────┘
```

---

## 🔢 Hisoblash formulalari

### Vakansiya (Vacancy)
```
Talab = lecGroups × weeklyLectureHours × weekCount
      + tutGroups × weeklyTutorialHours × weekCount
      + labGroups × weeklyLabHours × weekCount

Qoplangan = max(WorkloadAssignment, WorkloadRecord) per tur

Kerakli shtat = ⌈Qoplanmagan soatlar ÷ (avgWeeklyLoad × weekCount)⌉
```

### Shtat Birligi
```
Auditoriya soatlari = Ma'ruza + Amaliy + Laboratoriya + Seminar
Reyting soatlari    = Auditoriya × 0.20
Konsultatsiya       = Auditoriya × 0.005
Jami soatlar        = Auditoriya + Reyting + Konsultatsiya
O'rtacha yuk        = Jami soatlar ÷ Shtat birligi soni
```

---

## 🌐 Lokalizatsiya

Interfeys 3 tilda to'liq tarjima qilingan:

| Kalit | O'zbek | Русский | English |
|-------|--------|---------|---------|
| `appName` | Fakultet Ish Yuki | Нагрузка Преподавателей | Faculty Workload |
| `import.importFaculty` | O'qituvchilarni import qilish | Импорт преподавателей | Import Faculty |

Til tanlash `localStorage`da saqlanadi. Komponent: `LanguageSwitcher.tsx`

---

## 🤝 Hissa qo'shish

1. Fork qiling
2. Branch yarating: `git checkout -b feature/yangi-imkoniyat`
3. O'zgartirishlarni commit qiling
4. Push qiling: `git push origin feature/yangi-imkoniyat`
5. Pull Request oching

---

## 📄 Litsenziya

MIT License — batafsil [LICENSE](LICENSE) faylida.

---

<div align="center">
  <strong>Nizomiy nomidagi ЎМПУ</strong> uchun ishlab chiqilgan<br/>
  Built with ❤️ using React + Node.js + PostgreSQL
</div>
# university_workload
