/* Shared novel catalog: loaded by index.html (full) and lite.html. Edit novels here only. */
var novels = [
    {
        order: 1, title: "The Rain Pact", img: "./img/sub1/rp.jpg", link: "./rp/rpc.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 6, rating: 4.4, views: 15200, releaseOffsetDays: 900,
        chapterLinks: ["./rp/rpc1.html", "./rp/rpc2.html", "./rp/rpc3.html", "./rp/rpc4.html", "./rp/rpc5.html", "./rp/rpc6.html"],
        chapterLabels: ["Drizzle and Blue Umbrellas", "A Pact Made in Puddles", "Sunlight Between Storms", "When Umbrellas Stay Closed", "Umbrellas Left Behind", "The Choice · After the Rain"],
        blurb: "A chance meeting in the rain becomes a promise that follows two people through changing seasons, missed moments, and the choices that bring them back together.", grad: "135deg,#3a2a3f,#5c3a4a", collections: ["best-romance", "completed"]
    },
    {
        order: 2, title: "Ten Percent of Forever", img: "./img/sub1/tpof.jpg", link: "./tpof/tpof.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 8, rating: 4.7, views: 18000, releaseOffsetDays: 830,
        chapterLinks: ["./tpof/tpof1.html", "./tpof/tpof2.html", "./tpof/tpof3.html", "./tpof/tpof4.html", "./tpof/tpof5.html", "./tpof/tpof6.html", "./tpof/tpof7.html", "./tpof/tpofe.html"],
        chapterLabels: ["The Umbrella Incident", "Sketchbook Secrets", "Lunchbox Trade", "The Sound of Her Laugh", "The Confession Game", "The Fight", "The Last Morning, 7:10 AM", "After the Rain"],
        blurb: "Two young people find their way from umbrella mishaps and sketchbook secrets to a love tested by time. If forever were running short, what would you choose to keep?", grad: "135deg,#402a4a,#6a3a55", collections: ["best-romance", "completed", "editors-choice"]
    },
    {
        order: 3, title: "The Petal That Falls With a Smile Vol. 1", img: "./img/sub1/tptfwas.jpg", link: "./tptfwas/tptfwas.html", genres: ["drama", "slice"], status: "completed", ch: 4, rating: 4.9, views: 24400, releaseOffsetDays: 770,
        chapterLinks: ["./tptfwas/tptfwas1.html", "./tptfwas/tptfwas2.html", "./tptfwas/tptfwas3.html", "./tptfwas/tptfwas4.html"],
        chapterLabels: ["Sakura in November", "The Wrong Kind of Smile", "Confession After the Bell", "The Truth She Hid"],
        blurb: "Sakura’s smile hides more than she lets on. A confession after the school bell brings the truth into the open and asks what it means to let someone see you clearly.", grad: "135deg,#2f4a42,#3a6a55", collections: ["completed", "editors-choice"]
    },
    {
        order: 4, title: "The Day She Stayed", img: "./img/sub1/tdss.jpg", link: "./tdss/tdss.html", genres: ["romance", "drama", "sad"], status: "completed", ch: 11, rating: 4.6, views: 11100, releaseOffsetDays: 700,
        chapterLinks: ["./tdss/tdss1.html", "./tdss/tdss2.html", "./tdss/tdss3.html", "./tdss/tdss4.html", "./tdss/tdss5.html", "./tdss/tdss6.html", "./tdss/tdss7.html", "./tdss/tdss8.html", "./tdss/tdss9.html", "./tdss/tdss10.html", "./tdss/tdss11.html"],
        chapterLabels: ["The Boy Who Photographed the Sky", "The Rules", "Blue Stains and Paper Ribbons", "The Rule We Broke Together", "The Day the Sky Stopped Moving", "The Sky That Stood Still", "The Seat Beside the Window", "The Picture That Remembered Her", "The Day I Almost Forgot How to Breathe", "A Letter From the Girl Who Didn’t Know She’d Survive", "The Day the Sky Forgot Her Name"],
        blurb: "A boy looks back through photographs, shared rules, and the memories of a girl who stayed. Some days end at sunset; others keep shaping the lives that follow.", grad: "135deg,#2a3a4a,#3a5468", collections: ["completed", "editors-choice"]
    },
    {
        order: 5, title: "Him and Her", img: "./img/sub1/hah.jpg", link: "./hah/hah.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.5, views: 8300, releaseOffsetDays: 640,
        chapterLinks: ["./hah/hah1.html", "./hah/hah2.html", "./hah/hah3.html", "./hah/hah4.html", "./hah/hah5.html"],
        chapterLabels: ["Her", "Normal Day?", "A Silent Place", "Number", "Him"],
        blurb: "Her quiet presence unsettles his ordinary routine. Through awkward conversations and small acts of understanding, two classmates begin to close the distance between them.", grad: "135deg,#4a3a2a,#6a5230", collections: ["best-romance", "completed"]
    },
    {
        order: 6, title: "Case File: You", img: "./img/sub1/cfy.jpg", link: "./cfy/cfy.html", genres: ["mystery", "drama", "action"], status: "completed", ch: 15, rating: 4.9, views: 26000, releaseOffsetDays: 570,
        chapterLinks: ["./cfy/cfy1.html", "./cfy/cfy2.html", "./cfy/cfy3.html", "./cfy/cfy4.html", "./cfy/cfy5.html", "./cfy/cfy6.html", "./cfy/cfy7.html", "./cfy/cfy8.html", "./cfy/cfy9.html", "./cfy/cfy10.html", "./cfy/cfy11.html", "./cfy/cfy12.html", "./cfy/cfy13.html", "./cfy/cfy14.html", "./cfy/cfy15.html"],
        chapterLabels: ["The Detective", "The Clue", "The Interrogation", "One More", "AfterMath", "Past", "Lead", "Apartment Part 1", "Apartment Part 2", "The 8", "The Mark", "Revenge", "Final Verdict Part 1", "Final Verdict Part 2", "Final Verdict Part 3"],
        blurb: "A detective follows a trail of clues from an apartment to a final verdict. Each answer deepens the case—and raises new questions about the people behind it.", grad: "135deg,#3a2a4a,#5a2a30", collections: ["editors-choice"]
    },
    {
        order: 7, title: "The Other Side of Rain", img: "./img/sub1/tosor.jpg", link: "./tsor/tosor.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.7, views: 9100, releaseOffsetDays: 520, updatedDaysAgo: 1,
        chapterLinks: ["./tsor/tosor1.html", "./tsor/tosor2.html", "./tsor/tosor3.html", "./tsor/tosor4.html", "./tsor/tosor5.html"],
        chapterLabels: ["The Girl Who Always Forgot Her Umbrella", "Where the Water Seeps In", "The Truth Behind the Smile", "What the Rain Was Hiding", "The Days the Sky Forgot to Cry"],
        blurb: "A girl who keeps forgetting her umbrella meets the truths she has been trying to avoid. This rain-soaked companion story follows what happens after a smile begins to crack.", grad: "135deg,#2a3a4a,#3a5468", collections: ["best-romance", "completed"]
    },
    {
        order: 8, title: "The Petal That Falls With a Smile Vol. 2", img: "./img/sub1/tptfwasv2.jpg", link: "./tptfwas/tptfwasv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 5, rating: 4.8, views: 20200, releaseOffsetDays: 460,
        chapterLinks: ["./tptfwas/tptfwasv2-1.html", "./tptfwas/tptfwasv2-2.html", "./tptfwas/tptfwasv2-3.html", "./tptfwas/tptfwasv2-4.html", "./tptfwas/tptfwasv2-5.html"],
        chapterLabels: ["The Book With No Cover", "Letters in a Cold Spring", "A Name Beneath The Ink", "The Space Between Glances", "The Final Letter Isn’t Written"],
        blurb: "A book with no cover begins a new season of letters, glances, and things left unsaid. Five chapters follow the tender uncertainty of growing closer.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["completed"]
    },
    {
        order: 9, title: "The Girl Who Was Deleted", img: "./img/sub1/os.jpg", link: "./os/os.html", genres: ["mystery", "drama", "slice"], status: "completed", ch: 1, rating: 4.3, views: 4100, releaseOffsetDays: 400,
        chapterLinks: ["./os/os.html"],
        chapterLabels: ["The Girl Who Was Deleted"],
        blurb: "When someone disappears from the digital world, the traces they leave behind become a puzzle. A quiet mystery about memory, absence, and who gets remembered.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 10, title: "Him and Her Vol. 2", img: "./img/sub1/hahv2.jpg", link: "./hah/hahv2.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 4, rating: 4.5, views: 7800, releaseOffsetDays: 340,
        chapterLinks: ["./hah/hahv2-1.html", "./hah/hahv2-2.html", "./hah/hahv2-3.html", "./hah/hahv2-4.html"],
        chapterLabels: ["Why Him?", "Feelings", "Unexpected Tragedy & Lost", "We Can Be Friends Again"],
        blurb: "The story of Him and Her continues as friendship and affection grow more complicated. Old assumptions give way to difficult feelings and the possibility of starting over.", grad: "135deg,#4a3a2a,#6a5230", collections: ["completed"]
    },
    {
        order: 11, title: "The Petal That Falls With a Smile Vol. 3 ", img: "./img/sub1/tptfwasv3.jpg", link: "./tptfwas/tptfwasv3.html", genres: ["romance", "drama", "slice"], status: "completed", ch: 9, rating: 4.7, views: 19700, releaseOffsetDays: 270, updatedDaysAgo: 0.2,
        chapterLinks: ["./tptfwas/tptfwas3-1.html", "./tptfwas/tptfwasv3-2.html", "./tptfwas/tptfwasv3-3.html", "./tptfwas/tptfwasv3-4.html", "./tptfwas/tptfwasv3-5.html", "./tptfwas/tptfwasv3-6.html", "./tptfwas/tptfwasv3-7.html", "./tptfwas/tptfwasv3-8.html", "./tptfwas/tptfwasv3-9.html"],
        chapterLabels: ["Regret", "I Made a Friend… Did I?", "A Decision to Make", "Forgiveness?", "Past", "Haruki, I’m Sorry", "University Festival", "University Festival: Day One", "University Festival: Day Two"],
        blurb: "A new season brings new friendships, old regrets, and the uncertainty of university life. As festival preparations begin, the characters must decide what—and whom—they want to hold on to.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["best-romance", "newest"]
    },
    {
        order: 12, title: "Second Place Forever", img: "./img/sub1/os2.jpg", link: "./os/os2.html", genres: ["sad", "drama", "slice"], status: "completed", ch: 1, rating: 4.6, views: 3000, releaseOffsetDays: 220,
        chapterLinks: ["./os/os2.html"],
        chapterLabels: ["Second Place Forever"],
        blurb: "A heartfelt one-shot about the ache of coming second and the quiet courage it takes to see your own worth beyond someone else’s choice.", grad: "135deg,#2a3a4a,#3a5468", collections: ["hidden-gems", "completed"]
    },
    {
        order: 13, title: "The Hours I Sold", img: "./img/sub1/this.jpg", link: "./os/this.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.5, views: 2500, releaseOffsetDays: 170,
        chapterLinks: ["./os/this.html"],
        chapterLabels: ["The Hours I Sold"],
        blurb: "If you could trade something precious for one hour in the past, what would you ask to change? A reflective story about regret, memory, and the cost of looking back.", grad: "135deg,#3a2a2a,#5a3a30", collections: ["hidden-gems", "completed"]
    },
    {
        order: 14, title: "Him and Her vol.3", img: "./img/sub2/hahv3.jpg", link: "./hah/hahv3.html", genres: ["romance", "drama", "slice", "sad"], status: "completed", ch: 9, rating: 4.8, views: 21000, releaseOffsetDays: 46, updatedDaysAgo: 0.08,
        chapterLinks: ["./hah/hah05.html", "./hah/hah3-1.html", "./hah/hah3-2.html", "./hah/hah3-3.html", "./hah/hah3-4.html", "./hah/hah3-5.html", "./hah/hah3-6.html", "./hah/hah3-7.html", "./hah/hah3-8.html"],
        chapterLabels: ["After That", "Who Is He?", "A Boy", "Wondered?", "What Am I to You?", "I Like You", "The Date (Part 1)", "The Date Ends (Part 2)", "Memories"],
        blurb: "The next chapter of Him and Her follows a new set of confessions, dates, and memories. A half-remembered moment leads into the question of who he is—and what they mean to each other.", grad: "135deg,#4a2a3a,#6a3a4e", collections: ["newest"]
    },
    {
        order: 15, title: "The Bell That Rang for the Dead", img: "./img/sub2/osn.jpg", link: "./os/osn.html", genres: ["drama", "slice"], status: "completed", ch: 1, rating: 4.0, views: 3100, releaseOffsetDays: 0,
        chapterLinks: ["./os/osn.html"],
        chapterLabels: ["The Bell That Rang for the Dead"],
        blurb: "A single haunting story about the dead, the living, and the meaning carried by one unanswered bell. A quiet drama that lingers after its final note.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 16, title: "The Other Day", img: "./img/sub2/tod.jpg", link: "./tod/tod.html", genres: ["drama", "slice"], status: "completed", ch: 12, rating: 4.7, views: 20000, releaseOffsetDays: 0,
        chapterLinks: ["./tod/tod1.html", "./tod/tod2.html", "./tod/tod.3.html", "./tod/tod4.html", "./tod/tod5.html", "./tod/tod6.html", "./tod/tod7.html", "./tod/tod.8.html", "./tod/tod9.html", "./tod/tod10.html", "./tod/tod11.html", "./tod/tod12.html"],
        chapterLabels: ["The Notebook", "Wednesday", "The Question", "The Seat by the Window", "Friday", "April 17", "The House", "My Father's Room", "The Girl in the Photograph", "Yui", "The Person Who Wrote It", "We Did"],
        blurb: "A notebook, an old photograph, and a girl named Yui unsettle the rhythm of ordinary days. As questions turn toward the person behind the story, the familiar begins to feel strange.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 17, title: "The Seat Beside Me", img: "./img/sub2/tsbm.jpg", link: "./os/tsbm.html", genres: ["drama", "sad"], status: "completed", ch: 1, rating: 4.0, views: 6000, releaseOffsetDays: 0,
        chapterLinks: ["./os/tsbm.html"],
        chapterLabels: ["The Seat Beside Me"],
        blurb: "A brief, bittersweet story about a seat, an absence, and the memories people leave beside us. Sometimes the smallest details are the hardest to forget.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["hidden-gems"]
    },
    {
        order: 18, title: "Prequel of The Petal That Falls With A Smile", img: "./img/sub2/p1.jpg", link: "./tptfwas/p.html", genres: ["drama", "sad"], status: "Completed", ch: 5, rating: 4.9, views: 16000, releaseOffsetDays: 0,
        chapterLinks: ["./tptfwas/p1.html", "./tptfwas/p2.html", "./tptfwas/p3.html", "./tptfwas/p4.html", "./tptfwas/p5.html"],
        chapterLabels: ["The First Snow", "The Boy Who Stayed", "The Confession", "The Last Week", "Before I Leave"],
        blurb: "Before the story of falling petals, a first snow brings two people together. Their growing closeness leads to a confession, a final week, and the choice of whether to say goodbye.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 19, title: "The Petal That Falls With A Smile vol 4", img: "./img/sub2/tpv4.jpg", link: "./tptfwas/tptfwasv4.html", genres: ["drama", "slice"], status: "ongoing", ch: 4, rating: 4.9, views: 23000, releaseOffsetDays: 0,
        chapterLinks: ["./tptfwas/tptfwas4-1.html", "./tptfwas/tptfwas4-2.html", "./tptfwas/tptfwas4-3.html", "./tptfwas/tptfwas4-4.html"],
        chapterLabels: ["She Understood", "Fireworks", "A Date", "The Tree"],
        blurb: "The Petal story moves from university life toward adulthood. New milestones, changing relationships, and the future ahead ask the characters what they are ready to become.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 20, title: "Dead Air", img: "./img/sub2/DA.jpg", link: "./os/da.html", genres: ["drama", "mystery"], status: "completed", ch: 1, rating: 4.2, views: 15000, releaseOffsetDays: 0,
        chapterLinks: ["./os/da.html"],
        chapterLabels: ["Dead Air"],
        blurb: "A psychological murder mystery told in one sitting. Follow the trail of a disturbing case as the truth emerges from the voices, silences, and clues surrounding it.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["newest"]
    },
    {
        order: 21, title: "THE THINGS WE NEVER RETURNED", img: "./img/sub2/thwnr.jpg", link: "./tpof/thwnr.html", genres: ["drama", "mystery", "slice"], status: "completed", ch: 10, rating: 4.2, views: 19000, releaseOffsetDays: 0,
        chapterLinks: ["./tpof/thwnr1.html", "./tpof/thwnr2.html", "./tpof/thwnr3.html", "./tpof/thwnr4.html", "./tpof/thwnr5.html", "./tpof/thwnr6.html", "./tpof/thwnr7.html", "./tpof/thwnr8.html", "./tpof/thwnr9.html", "./tpof/thwnre.html"],
        chapterLabels: ["The Book with No Price", "The First Rule of Investigating Nothing", "A Drawer Full of Almosts", "Someone on the Other Side of the Window", "The Girl Who Stayed", "The Things We Keep", "A Flower with No Name", "Nobody’s Villain", "The Things We Never Returned", "Things We Leave Behind"],
        blurb: "Set in the world of Ten Percent of Forever, this story follows a bookshop, a trail of returned keepsakes, and the people connected by what they could not bring themselves to give back.", grad: "135deg,#3a2a4a,#4a2a3a", collections: ["completed", "newest"],

    },
    {
        order: 22, title: "The Dead Man’s Alibi", img: "./img/sub2/tdma.jpg", link: "./tdss/tdma.html", genres: ["mystery", "drama", "action"], status: "upcoming", ch: 0, rating: 0, views: 0, releaseOffsetDays: 0,
        chapterLinks: ["./tdss/tdma1.html", "./tdss/tdma2.html", "./tdss/tdma3.html", "./tdss/tdma4.html", "./tdss/tdma5.html", "./tdss/tdma6.html", "./tdss/tdma7.html", "./tdss/tdma8.html", "./tdss/tdma9.html", "./tdss/tdma10.html", "./tdss/tdma11.html", "./tdss/tdmae.html"],
        chapterLabels: ["The Man Who Wasn’t There", "The Girl at the Door", "Four Men, One Dead Man", "The Girl Who Knew Too Much", "People We Meet Along the Way", "The Locker Under Platform Nine", "The Names Nobody Remembered", "A Man Who Died Twice", "The Dead Man’s Alibi", "The Last Person to Leave", "A Better Kind of Tomorrow", "Nobody’s Alibi"],
        blurb: "Detective Toma Kisaragi investigates a dead man with an impossible alibi. Four cases, a missing woman, and a buried archive draw him toward a truth someone wants kept hidden.", grad: "135deg,#171a22,#6f252c", collections: ["newest"]
    },
    {
        order: 23, title: "Case File: The Silence Between Rings", img: "./img/sub2/cfs.jpg", link: "./cfy/cfs.html", genres: ["mystery", "drama"], status: "ongoing", ch: 1, rating: 4.2, views: 10000, releaseOffsetDays: 0,
        chapterLinks: ["./cfy/cfs1.html"],
        chapterLabels: ["2:17 AM"],
        blurb: "Set in the Case File: You universe, a dispatcher answers a call from a line that should be dead. A detective, a journalist, and a room missing from the plan lead toward the silence between rings.", grad: "135deg,#3a2a4a,#5a2a30", collections: ["newest"]
    },
];
