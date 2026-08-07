"use strict";

/* ==========================================
   الصفحة الرئيسية
   Home Page
========================================== */

const HomePage = {

    title: "الرئيسية",

    render() {

        return `
            <section class="page">

                <header class="hero">
                    <h1>الرفيق</h1>

                    <p>
                        التطبيق الإسلامي الذكي
                    </p>
                </header>

                <section class="card">

                    <h2>مرحباً بك</h2>

                    <p>
                        هذه هي الصفحة الرئيسية للمشروع.
                    </p>

                </section>

            </section>
        `;

    }

};

window.HomePage = HomePage;
