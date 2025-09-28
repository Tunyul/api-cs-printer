-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: cukong_db
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `order_details`
--

DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int NOT NULL,
  `harga_satuan` decimal(15,2) NOT NULL,
  `subtotal_item` decimal(15,2) NOT NULL,
  `id_order` int DEFAULT NULL,
  `id_produk` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_order` (`id_order`),
  KEY `id_produk` (`id_produk`),
  CONSTRAINT `order_details_ibfk_1791` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_details_ibfk_1792` FOREIGN KEY (`id_produk`) REFERENCES `products` (`id_produk`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (1,80,25000.00,2000000.00,1,2,'2025-09-28 02:09:50','2025-09-28 02:09:50'),(2,100,25000.00,2500000.00,1,5,'2025-09-28 02:09:50','2025-09-28 02:09:50');
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id_order` int NOT NULL AUTO_INCREMENT,
  `no_transaksi` varchar(255) NOT NULL,
  `id_customer` int NOT NULL,
  `tanggal_order` datetime NOT NULL,
  `status_urgensi` varchar(255) NOT NULL,
  `total_bayar` decimal(15,2) NOT NULL DEFAULT '0.00',
  `dp_bayar` decimal(15,2) DEFAULT '0.00',
  `status_bayar` varchar(255) NOT NULL,
  `tanggal_jatuh_tempo` datetime NOT NULL,
  `link_invoice` text,
  `link_drive` text,
  `status_order` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `status` enum('pending','proses','selesai','batal') DEFAULT 'pending',
  `catatan` text,
  `status_bot` enum('pending','selesai') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id_order`),
  UNIQUE KEY `no_transaksi` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_2` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_3` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_4` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_5` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_6` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_7` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_8` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_9` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_10` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_11` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_12` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_13` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_14` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_15` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_16` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_17` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_18` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_19` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_20` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_21` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_22` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_23` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_24` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_25` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_26` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_27` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_28` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_29` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_30` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_31` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_32` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_33` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_34` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_35` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_36` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_37` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_38` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_39` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_40` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_41` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_42` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_43` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_44` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_45` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_46` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_47` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_48` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_49` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_50` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_51` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_52` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_53` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_54` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_55` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_56` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_57` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_58` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_59` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_60` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_61` (`no_transaksi`),
  UNIQUE KEY `no_transaksi_62` (`no_transaksi`),
  KEY `id_customer` (`id_customer`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`id_customer`) REFERENCES `customers` (`id_customer`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'TRX-28092025-6597-CICI',1,'2025-09-28 02:08:33','normal',4500000.00,3100000.00,'dp','2025-10-05 02:08:33','','https://drive.google.com/drive/folders/1VtkJLY9gM9aWEePEkmdWOpw9Hn8j9fqi','proses',NULL,'2025-09-28 03:07:28',4500000.00,'proses','','selesai');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id_payment` int NOT NULL AUTO_INCREMENT,
  `nominal` decimal(15,2) NOT NULL,
  `tanggal` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bukti` varchar(255) DEFAULT NULL,
  `tipe` enum('dp','pelunasan') NOT NULL,
  `no_transaksi` varchar(255) NOT NULL,
  `no_hp` varchar(255) NOT NULL,
  `status` enum('pending','menunggu_verifikasi','verified','confirmed') DEFAULT 'pending',
  PRIMARY KEY (`id_payment`),
  KEY `no_transaksi` (`no_transaksi`),
  KEY `no_hp` (`no_hp`),
  CONSTRAINT `payments_ibfk_873` FOREIGN KEY (`no_transaksi`) REFERENCES `orders` (`no_transaksi`) ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_874` FOREIGN KEY (`no_hp`) REFERENCES `customers` (`no_hp`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,2000000.00,'2025-09-28 02:23:08','https://drive.google.com/file/d/1Vvc69L7g8SDXX9I0gcDscvGHWhgweUir/view?usp=drivesdk','dp','TRX-28092025-6597-CICI','6288806301215','verified'),(2,300000.00,'2025-09-28 02:28:38','https://drive.google.com/file/d/1RxFP21LtH4awqiONW9sVfCReC99xKWmv/view?usp=drivesdk','dp','TRX-28092025-6597-CICI','6288806301215','verified'),(3,500000.00,'2025-09-28 02:44:40','https://drive.google.com/file/d/1_fOIOmlHBSjFxjrzuxs_kiStU6R8CZGq/view?usp=drivesdk','dp','TRX-28092025-6597-CICI','6288806301215','verified'),(4,300000.00,'2025-09-28 02:46:03','https://drive.google.com/file/d/1fJUe5R1wcrHhJwZYYdKSnd_AjiBnTBDx/view?usp=drivesdk','dp','TRX-28092025-6597-CICI','6288806301215','verified');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `piutang`
--

DROP TABLE IF EXISTS `piutang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `piutang` (
  `id_piutang` int NOT NULL AUTO_INCREMENT,
  `id_customer` int DEFAULT NULL,
  `jumlah_piutang` decimal(10,2) NOT NULL,
  `tanggal_piutang` datetime NOT NULL,
  `status` enum('belum_lunas','lunas','terlambat') DEFAULT 'belum_lunas',
  `keterangan` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `id_order` int DEFAULT NULL,
  PRIMARY KEY (`id_piutang`),
  KEY `id_customer` (`id_customer`),
  KEY `id_order` (`id_order`),
  CONSTRAINT `piutang_ibfk_479` FOREIGN KEY (`id_customer`) REFERENCES `customers` (`id_customer`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `piutang_ibfk_480` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piutang`
--

LOCK TABLES `piutang` WRITE;
/*!40000 ALTER TABLE `piutang` DISABLE KEYS */;
INSERT INTO `piutang` VALUES (2,1,2500000.00,'2025-09-28 02:26:16','belum_lunas',NULL,'2025-09-28 02:26:16','2025-09-28 02:57:26',2500000.00,1);
/*!40000 ALTER TABLE `piutang` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-28 10:17:17
