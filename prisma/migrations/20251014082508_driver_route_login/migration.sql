-- CreateTable
CREATE TABLE "DriverRouteLogin" (
    "id" SERIAL NOT NULL,
    "ridicEmail" TEXT NOT NULL,
    "cisloTrasy" TEXT NOT NULL,
    "casPrihlaseni" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverRouteLogin_pkey" PRIMARY KEY ("id")
);
