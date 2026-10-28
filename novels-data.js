/* Shared novel catalog: loaded by index.html (full) and lite.html. Edit novels here only. */
var novels = [
    {
        order: 1, title: "The Rain Pact", img: "./img/sub1/rp.jpg", link: "./rp/rpc.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 6, rating: 4.4, views: 15200, releaseOffsetDays: 900,
        blurb: "A story about the bonds we make, the promises we keep, and the rain that falls between us.", grad: "135deg,#3a2a3f,#5c3a4a", collections: ["best-romance", "completed"]
    },
    {
        order: 2, title: "Ten Percent of Forever", img: "./img/sub1/tpof.jpg", link: "./tpof/tpof.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 8, rating: 4.7, views: 18000, releaseOffsetDays: 830,
        blurb: "If you only had ten percent of your time left to spend with the person you loved, how would you spend it?", grad: "135deg,#402a4a,#6a3a55", collections: ["best-romance", "completed", "editors-choice"]
    },
    {
        order: 3, title: "The Petal That Falls With a Smile Vol. 1", img: "./img/sub1/tptfwas.jpg", link: "./tptfwas/tptfwas.html", genres: ["drama", "slice"], status: "completed", ch: 4, rating: 4.9, views: 24400, releaseOffsetDays: 770,
        blurb: "Life is a series of small smiles and falling petals. A gentle exploration of growing up and letting go.", grad: "135deg,#2f4a42,#3a6a55", collections: ["completed", "editors-choice"]
    },
    {
        order: 4, title: "The Day She Stayed", img: "./img/sub1/tdss.jpg", link: "./tdss/tdss.html", genres: ["romance", "drama", "sad"], status: "completed", ch: 11, rating: 4.6, views: 11100, releaseOffsetDays: 700,
        blurb: "She was only supposed to stay for the day. But some days last a lifetime in our memories.", grad: "135deg,#2a3a4a,#3a5468", collections: ["completed", "editors-choice"]
    },
    {
        order: 5, title: "Him and Her", img: "./img/sub1/hah.jpg", link: "./hah/hah.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.5, views: 8300, releaseOffsetDays: 640,
        blurb: "A simple story about him, her, and the quiet spaces between their words.", grad: "135deg,#4a3a2a,#6a5230", collections: ["best-romance", "completed"]
    },
    {
        order: 6, title: "Case File: You", img: "./img/sub1/cfy.jpg", link: "./cfy/cfy.html", genres: ["mystery", "drama", "action"], status: "completed", ch: 15, rating: 4.9, views: 26000, releaseOffsetDays: 570,
        blurb: "A mystery that begins with a single file. Who are you, really, when the world isn't looking?", grad: "135deg,#3a2a4a,#5a2a30", collections: ["editors-choice"]
    },
    {
        order: 7, title: "The Other Side of Rain", img: "./img/sub1/tosor.jpg", link: "./tsor/tosor.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.7, views: 9100, releaseOffsetDays: 520, updatedDaysAgo: 1,
        blurb: "The rain didn't stop when the story ended. A companion piece to the emotional journey of The Rain Pact.", grad: "135deg,#2a3a4a,#3a5468", collections: ["best-romance", "completed"]
    },
    {
        order: 8, title: "The Petal That Falls With a Smile Vol. 2", img: "./img/sub1/tptfwasv2.jpg", link: "./tptfwas/tptfwasv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.8, views: 20200, releaseOffsetDays: 460,
        blurb: "Spring returns, and with it, new stories of love and loss in the second volume of the Petal series.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["completed"]
    },
    {
        order: 9, title: "The Girl Who Was Deleted", img: "./img/sub1/os.jpg", link: "./os/os.html", genres: ["mystery", "drama", "slice"], status: "completed", ch: 1, rating: 4.3, views: 4100, releaseOffsetDays: 400,
        blurb: "What happens to the digital ghosts we leave behind? A mystery wrapped in a slice-of-life shell.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 10, title: "Him and Her Vol. 2", img: "./img/sub1/hahv2.jpg", link: "./hah/hahv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 4, rating: 4.5, views: 7800, releaseOffsetDays: 340,
        blurb: "Continuing the journey of Him and Her into a new chapter of their lives.", grad: "135deg,#4a3a2a,#6a5230", collections: ["completed"]
    },
    {
        order: 11, title: "The Petal That Falls With a Smile Vol. 3 ", img: "./img/sub1/tptfwasv3.jpg", link: "./tptfwas/tptfwasv3.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 9, rating: 4.7, views: 19700, releaseOffsetDays: 270, updatedDaysAgo: 0.2,
        blurb: "The petals continue to fall as we enter the third volume of this heartwarming saga.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["best-romance", "newest"]
    },
    {
        order: 12, title: "Second Place Forever", img: "./img/sub1/os2.jpg", link: "./os/os2.html", genres: ["sad", "drama", "slice"], status: "completed", ch: 1, rating: 4.6, views: 3000, releaseOffsetDays: 220,
        blurb: "Coming in second isn't always losing. A poignant one-shot about the beauty of being enough.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 13, title: "The Hours I Sold", img: "./img/sub1/this.jpg", link: "./os/this.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.5, views: 2500, releaseOffsetDays: 170,
        blurb: "If time was a currency, how much would you pay for a single hour of the past?", grad: "135deg,#3a2a2a,#5a3a30", collections: ["hidden-gems", "completed"]
    },
    {
        order: 14, title: "Him and Her vol.3", img: "./img/sub2/hahv3.jpg", link: "./hah/hahv3.html", genres: ["romance", "drama", "slice", "sad"], status: "completed", ch: 9, rating: 4.8, views: 21000, releaseOffsetDays: 46, updatedDaysAgo: 0.08,
        blurb: "Continuing the journey of Him and Her into a new chapter of their lives.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["newest"]
    },
    {
        order: 15, title: "The Bell That Rang for the Dead", img: "./img/sub2/osn.jpg", link: "./os/osn.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.0, views: 3100, releaseOffsetDays: 0,
        blurb: "ONE SHOT.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 16, title: "The Other Day", img: "./img/sub2/tod.jpg", link: "./tod/tod.html", genres: ["drama", "slice"], status: "ongoing", ch: 9, rating: 4.7, views: 20000, releaseOffsetDays: 0,
        blurb: "normal days?", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 17, title: "The Seat Beside Me", img: "./img/sub2/tsbm.jpg", link: "./os/tsbm.html", genres: ["drama", "sad"], status: "completed", ch: 1, rating: 4.0, views: 6000, releaseOffsetDays: 0,
        blurb: "ONE SHOT", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 18, title: "Prequel of The Petal That Falls With A Smile", img: "./img/sub2/p1.jpg", link: "./tptfwas/p.html", genres: ["drama", "sad"], status: "Completed", ch: 5, rating: 4.9, views: 16000, releaseOffsetDays: 0,
        blurb: "TRY IT!", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 19, title: "The Petal That Falls With A Smile vol 4", img: "./img/sub2/tpv4.jpg", link: "./tptfwas/tptfwasv4.html", genres: ["drama", "slice"], status: "ongoing", ch: 2, rating: 4.6, views: 6000, releaseOffsetDays: 0,
        blurb: "Volume 4 — University → Adulthood Arc", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 20, title: "Dead Air", img: "./img/sub2/DA.jpg", link: "./os/da.html", genres: ["drama", "mystery"], status: "completed", ch: 1, rating: 4.2, views: 15000, releaseOffsetDays: 0,
        blurb: "Psychological Thriller · Murder Mystery · One-Shot", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
     {
        order: 21, title: "THE THINGS WE NEVER RETURNED", img: "./img/sub2/thwnr.jpg", link: "./tpof/thwnr.html", genres: ["drama", "mystery","slice"], status: "upcoming", ch: 0, rating: null, views: null, releaseOffsetDays: 0,
        blurb: "A story set in the universe of Ten Percent of Forever", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
];
