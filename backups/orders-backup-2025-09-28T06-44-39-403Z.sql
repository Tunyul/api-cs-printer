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
  CONSTRAINT `order_details_ibfk_1799` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_details_ibfk_1800` FOREIGN KEY (`id_produk`) REFERENCES `products` (`id_produk`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (1,2,25000.00,50000.00,1,1,'2025-09-28 03:34:17','2025-09-28 03:34:17'),(3,4,25000.00,100000.00,3,1,'2025-09-28 04:08:22','2025-09-28 04:08:22'),(4,2000,25000.00,50000000.00,3,2,'2025-09-28 04:08:22','2025-09-28 04:08:22'),(5,4,25000.00,100000.00,4,1,'2025-09-28 04:11:15','2025-09-28 04:11:15'),(6,2000,25000.00,50000000.00,4,2,'2025-09-28 04:11:15','2025-09-28 04:11:15'),(7,80,25000.00,2000000.00,5,1,'2025-09-28 04:30:09','2025-09-28 04:30:09'),(8,2000,150.00,300000.00,5,15,'2025-09-28 04:30:09','2025-09-28 04:30:09'),(9,80,25000.00,2000000.00,6,1,'2025-09-28 04:47:52','2025-09-28 04:47:52'),(10,5000,150.00,750000.00,6,15,'2025-09-28 04:47:53','2025-09-28 04:47:53'),(11,80,25000.00,2000000.00,7,2,'2025-09-28 06:21:45','2025-09-28 06:21:45'),(12,5000,25000.00,125000000.00,7,6,'2025-09-28 06:21:45','2025-09-28 06:21:45'),(13,4,25000.00,100000.00,8,1,'2025-09-28 06:23:12','2025-09-28 06:23:12'),(14,5000,150.00,750000.00,8,15,'2025-09-28 06:23:12','2025-09-28 06:23:12'),(15,80,25000.00,2000000.00,9,1,'2025-09-28 06:25:40','2025-09-28 06:25:40'),(16,5000,150.00,750000.00,9,15,'2025-09-28 06:25:40','2025-09-28 06:25:40'),(17,80,25000.00,2000000.00,9,1,'2025-09-28 06:41:29','2025-09-28 06:41:29'),(18,5000,150.00,750000.00,9,15,'2025-09-28 06:41:29','2025-09-28 06:41:29');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'TRX-28092025-5020-CICI',1,'2025-09-28 03:32:16','normal',50000.00,50000.00,'lunas','2025-10-05 03:32:16','','https://drive.google.com/drive/folders/1488zFxrqB4OO92pe62AaXgiLZ3xwvkIw','selesai',NULL,'2025-09-28 03:36:37',50000.00,'selesai','','selesai'),(2,'TRX-28092025-6747-CICI',1,'2025-09-28 03:42:51','normal',50000.00,50000.00,'lunas','2025-10-05 03:42:51','','https://drive.google.com/drive/folders/19tzEqGqAjbBBKkLDPZOUgYcnXIBFipKY','selesai',NULL,'2025-09-28 03:46:42',50000.00,'selesai','','selesai'),(3,'TRX-28092025-9517-CICI',1,'2025-09-28 03:59:41','normal',50100000.00,50100000.00,'lunas','2025-10-05 03:59:41','','https://drive.google.com/drive/folders/1D1eJcZ4aUIwHMiOns8HkXaPZyLg7xowL','selesai',NULL,'2025-09-28 04:10:05',50100000.00,'selesai','','selesai'),(4,'TRX-28092025-7917-CICI',1,'2025-09-28 04:10:50','normal',50100000.00,50100000.00,'lunas','2025-10-05 04:10:50','','https://drive.google.com/drive/folders/1cUsu2EoHfRSfMpOEA4rAhrnUo8Nxu8FA','selesai',NULL,'2025-09-28 04:15:12',50100000.00,'selesai','','selesai'),(5,'TRX-28092025-9175-CICI',1,'2025-09-28 04:13:40','normal',2300000.00,2300000.00,'lunas','2025-10-05 04:13:40','','https://drive.google.com/drive/folders/1j2ZliCH85fpAuTaeAkL3EcwYQmByx7-d','selesai',NULL,'2025-09-28 04:45:17',2300000.00,'selesai','','selesai'),(6,'TRX-28092025-9191-CICI',1,'2025-09-28 04:46:37','normal',2750000.00,2750000.00,'lunas','2025-10-05 04:46:37','','https://drive.google.com/drive/folders/19oicG3YZfRrSi_777ekrmwKs0wP0yB35','selesai',NULL,'2025-09-28 06:09:19',2750000.00,'proses','','selesai'),(7,'TRX-28092025-6728-CICI',1,'2025-09-28 06:21:23','normal',0.00,0.00,'belum_lunas','2025-10-05 06:21:23','','https://drive.google.com/drive/folders/1XE8gkgZIxZPQJggf9SdK3CJpf7V17n3q','pending',NULL,NULL,0.00,'pending','','selesai'),(8,'TRX-28092025-6397-CICI',1,'2025-09-28 06:22:34','normal',850000.00,0.00,'belum_lunas','2025-10-05 06:22:34','','https://drive.google.com/drive/folders/1evdhelrDXeOOZssWzG59AabC2lfc_ptH','pending',NULL,NULL,850000.00,'pending','','selesai'),(9,'TRX-28092025-7608-CICI',1,'2025-09-28 06:24:12','normal',5500000.00,0.00,'belum_lunas','2025-10-05 06:24:12','','https://drive.google.com/drive/folders/1egOI7Xq4IEUz5MkLbsQfwelzWTGGvq3c','pending',NULL,NULL,5500000.00,'pending','','selesai');
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
  CONSTRAINT `payments_ibfk_881` FOREIGN KEY (`no_transaksi`) REFERENCES `orders` (`no_transaksi`) ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_882` FOREIGN KEY (`no_hp`) REFERENCES `customers` (`no_hp`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,20000.00,'2025-09-28 03:35:04','https://drive.google.com/file/d/1at0yPzZHTDqvknVkNc_nYLdCVGfQrTj0/view?usp=drivesdk','dp','TRX-28092025-5020-CICI','6288806301215','verified'),(2,30000.00,'2025-09-28 03:36:16','https://drive.google.com/file/d/1emOKCsWT9QpXf5lTSkuP7yl28r4UExlL/view?usp=drivesdk','pelunasan','TRX-28092025-5020-CICI','6288806301215','verified'),(3,50000.00,'2025-09-28 03:46:23','https://drive.google.com/file/d/1An72C1qjAa_5POOnpmMJsviTuQ5p-jbU/view?usp=drivesdk','pelunasan','TRX-28092025-6747-CICI','6288806301215','verified'),(4,50100000.00,'2025-09-28 04:06:26','https://drive.google.com/file/d/1qQRLXA8vwQeXzXXOdt-4STmA01tGoTWc/view?usp=drivesdk','pelunasan','TRX-28092025-9517-CICI','6288806301215','verified'),(5,41000000.00,'2025-09-28 04:12:43','https://drive.google.com/file/d/1hwRlPptSA5SwaXUUZk95N353tgsnE9Xq/view?usp=drivesdk','dp','TRX-28092025-7917-CICI','6288806301215','verified'),(6,9100000.00,'2025-09-28 04:14:56','https://drive.google.com/file/d/13dJbwTteNe__SGL9AdmuwEEiz_68iT4H/view?usp=drivesdk','pelunasan','TRX-28092025-7917-CICI','6288806301215','verified'),(7,500000.00,'2025-09-28 04:30:57','https://drive.google.com/file/d/1kN-zJcHvs0K-uZOHca7Ymh1lXg8J347Q/view?usp=drivesdk','dp','TRX-28092025-9175-CICI','6288806301215','verified'),(8,1800000.00,'2025-09-28 04:45:02','https://drive.google.com/file/d/1ajKIegmTPYVF8o9m30cvmQsDLzBQ6zbh/view?usp=drivesdk','pelunasan','TRX-28092025-9175-CICI','6288806301215','verified'),(9,750000.00,'2025-09-28 04:48:51','https://drive.google.com/file/d/1T0BrsroOqcDOHFiyV-RTQDKihvy-6pCF/view?usp=drivesdk','dp','TRX-28092025-9191-CICI','6288806301215','verified'),(10,1500000.00,'2025-09-28 04:59:37','https://drive.google.com/file/d/15Y5bz1fZjwbsmnsvFMnHJnMDqpLks2Oo/view?usp=drivesdk','dp','TRX-28092025-9191-CICI','6288806301215','verified'),(11,500000.00,'2025-09-28 06:09:05','https://drive.google.com/file/d/1MWiXgw8jh3d5aFP6Z6otay9kAPuAQ9Zl/view?usp=drivesdk','pelunasan','TRX-28092025-9191-CICI','6288806301215','verified');
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
  CONSTRAINT `piutang_ibfk_487` FOREIGN KEY (`id_customer`) REFERENCES `customers` (`id_customer`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `piutang_ibfk_488` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piutang`
--

LOCK TABLES `piutang` WRITE;
/*!40000 ALTER TABLE `piutang` DISABLE KEYS */;
INSERT INTO `piutang` VALUES (1,1,30000.00,'2025-09-28 03:35:27','lunas',NULL,'2025-09-28 03:35:27','2025-09-28 03:36:37',30000.00,1),(2,1,9100000.00,'2025-09-28 04:13:07','lunas',NULL,'2025-09-28 04:13:07','2025-09-28 04:15:12',9100000.00,4),(3,1,1800000.00,'2025-09-28 04:31:11','lunas',NULL,'2025-09-28 04:31:11','2025-09-28 04:45:17',1800000.00,5),(4,1,2000000.00,'2025-09-28 04:49:04','lunas',NULL,'2025-09-28 04:49:04','2025-09-28 06:09:19',2000000.00,6);
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

-- Dump completed on 2025-09-28 13:44:39
