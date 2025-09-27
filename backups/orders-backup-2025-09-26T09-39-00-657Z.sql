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
  CONSTRAINT `order_details_ibfk_1753` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_details_ibfk_1754` FOREIGN KEY (`id_produk`) REFERENCES `products` (`id_produk`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (1,12,150.00,1800.00,1,15,'2025-09-24 16:42:20','2025-09-24 16:42:20'),(2,2,25000.00,50000.00,1,9,'2025-09-24 16:42:20','2025-09-24 16:42:20'),(3,4,25000.00,100000.00,2,1,'2025-09-24 16:42:42','2025-09-24 16:42:42'),(4,48,25000.00,1200000.00,3,2,'2025-09-24 17:06:14','2025-09-24 17:06:14'),(5,48,25000.00,1200000.00,4,2,'2025-09-24 17:13:57','2025-09-24 17:13:57'),(6,48,25000.00,1200000.00,53,3,'2025-09-25 07:51:06','2025-09-25 07:51:06'),(7,100,25000.00,2500000.00,54,3,'2025-09-25 12:09:35','2025-09-25 12:09:35'),(8,80,25000.00,2000000.00,55,2,'2025-09-26 08:37:26','2025-09-26 08:37:26');
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
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'TRX-24092025-6334-MAUL',33,'2025-09-24 16:41:21','normal',51800.00,51800.00,'lunas','2025-10-01 16:41:21','','https://drive.google.com/drive/folders/1IYtFNHZmHRhHIidA6-bR3aKGF4m0leVC','selesai',NULL,'2025-09-24 16:46:21',51800.00,'selesai','','selesai'),(2,'TRX-24092025-8752-CICI',1,'2025-09-24 16:41:36','normal',100000.00,100000.00,'lunas','2025-10-01 16:41:36','','https://drive.google.com/drive/folders/16W-DA2AQ7y6-ugMs_h07uRbYMlPBOfw0','selesai',NULL,'2025-09-24 17:04:27',100000.00,'selesai','','selesai'),(3,'TRX-25092025-8029-CICI',1,'2025-09-24 17:04:43','normal',1200000.00,1200000.00,'lunas','2025-10-01 17:04:43','','https://drive.google.com/drive/folders/1mJBLTSjPG5UVDj3-tpVZRTPnX3yVu5OT','selesai',NULL,'2025-09-24 17:08:12',1200000.00,'proses','','selesai'),(4,'TRX-25092025-3129-CICI',1,'2025-09-24 17:12:40','normal',1200000.00,500000.00,'belum_lunas','2025-10-01 17:12:40','','https://drive.google.com/drive/folders/19prxZCsl3SXSyo54yP71gD5HnPpVA9Mt','proses',NULL,'2025-09-24 17:15:09',1200000.00,'selesai','','selesai'),(5,'TRX-20250925-3470-CICI',34,'2025-09-25 04:27:53','normal',574349.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',569826.00,'pending','Seeded order #1','pending'),(6,'TRX-20250925-7818-CICI',35,'2025-09-25 04:27:53','normal',369301.00,369301.00,'lunas','2025-10-02 04:27:53',NULL,NULL,'selesai','2025-09-25 04:27:53','2025-09-25 04:27:53',350850.00,'pending','Seeded order #2','selesai'),(7,'TRX-20250925-8704-CICI',36,'2025-09-25 04:27:53','normal',319591.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',288544.00,'pending','Seeded order #3','pending'),(8,'TRX-20250925-6742-CICI',37,'2025-09-25 04:27:53','normal',317118.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',315900.00,'pending','Seeded order #4','pending'),(9,'TRX-20250925-9655-CICI',38,'2025-09-25 04:27:53','normal',1175882.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',1127573.00,'pending','Seeded order #5','pending'),(10,'TRX-20250925-1119-CICI',39,'2025-09-25 04:27:53','normal',666885.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',663902.00,'pending','Seeded order #6','pending'),(11,'TRX-20250925-3096-CICI',40,'2025-09-25 04:27:53','normal',1469789.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',1455175.00,'pending','Seeded order #7','pending'),(12,'TRX-20250925-2330-CICI',41,'2025-09-25 04:27:53','normal',977482.00,977482.00,'lunas','2025-10-02 04:27:53',NULL,NULL,'selesai','2025-09-25 04:27:53','2025-09-25 04:27:53',927971.00,'selesai','Seeded order #8','selesai'),(13,'TRX-20250925-2413-CICI',42,'2025-09-25 04:27:53','normal',1261316.00,0.00,'belum_lunas','2025-10-02 04:27:53',NULL,NULL,'pending','2025-09-25 04:27:53','2025-09-25 04:27:53',1268025.00,'pending','Seeded order #9','pending'),(14,'TRX-20250925-2388-CICI',43,'2025-09-25 04:27:53','normal',627566.00,238475.00,'dp','2025-10-02 04:27:53',NULL,NULL,'proses','2025-09-25 04:27:53','2025-09-25 04:27:54',617303.00,'pending','Seeded order #10','selesai'),(15,'TRX-20250925-3934-CICI',44,'2025-09-25 04:27:54','normal',644467.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',607694.00,'pending','Seeded order #11','pending'),(16,'TRX-20250925-6364-CICI',45,'2025-09-25 04:27:54','normal',740570.00,740570.00,'lunas','2025-10-02 04:27:54',NULL,NULL,'selesai','2025-09-25 04:27:54','2025-09-25 04:27:54',712862.00,'pending','Seeded order #12','selesai'),(17,'TRX-20250925-8139-CICI',34,'2025-09-25 04:27:54','normal',1528803.00,489217.00,'dp','2025-10-02 04:27:54',NULL,NULL,'proses','2025-09-25 04:27:54','2025-09-25 04:27:54',1483665.00,'pending','Seeded order #13','selesai'),(18,'TRX-20250925-1195-CICI',35,'2025-09-25 04:27:54','normal',846732.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',818831.00,'pending','Seeded order #14','pending'),(19,'TRX-20250925-6496-CICI',36,'2025-09-25 04:27:54','normal',170988.00,22228.00,'dp','2025-10-02 04:27:54',NULL,NULL,'proses','2025-09-25 04:27:54','2025-09-25 04:27:54',141507.00,'proses','Seeded order #15','selesai'),(20,'TRX-20250925-5816-CICI',37,'2025-09-25 04:27:54','normal',1271160.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',1288939.00,'pending','Seeded order #16','pending'),(21,'TRX-20250925-7678-CICI',38,'2025-09-25 04:27:54','normal',1336241.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',1349647.00,'pending','Seeded order #17','pending'),(22,'TRX-20250925-5585-CICI',39,'2025-09-25 04:27:54','normal',1276621.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',1253333.00,'pending','Seeded order #18','pending'),(23,'TRX-20250925-4168-CICI',40,'2025-09-25 04:27:54','normal',833874.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',796784.00,'pending','Seeded order #19','pending'),(24,'TRX-20250925-2551-CICI',41,'2025-09-25 04:27:54','normal',1347377.00,1347377.00,'lunas','2025-10-02 04:27:54',NULL,NULL,'selesai','2025-09-25 04:27:54','2025-09-25 04:27:54',1330510.00,'pending','Seeded order #20','selesai'),(25,'TRX-20250925-6924-CICI',42,'2025-09-25 04:27:54','normal',1304317.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',1308311.00,'pending','Seeded order #21','pending'),(26,'TRX-20250925-1535-CICI',43,'2025-09-25 04:27:54','normal',922491.00,0.00,'belum_lunas','2025-10-02 04:27:54',NULL,NULL,'pending','2025-09-25 04:27:54','2025-09-25 04:27:54',933670.00,'pending','Seeded order #22','pending'),(27,'TRX-20250925-8434-CICI',44,'2025-09-25 04:27:54','normal',1385785.00,1385785.00,'lunas','2025-10-02 04:27:54',NULL,NULL,'selesai','2025-09-25 04:27:54','2025-09-25 04:27:54',1379892.00,'selesai','Seeded order #23','selesai'),(28,'TRX-20250925-9647-CICI',45,'2025-09-25 04:27:55','normal',322129.00,0.00,'belum_lunas','2025-10-02 04:27:55',NULL,NULL,'pending','2025-09-25 04:27:55','2025-09-25 04:27:55',310852.00,'pending','Seeded order #24','pending'),(29,'TRX-20250925-4755-CICI',34,'2025-09-25 04:27:55','normal',376071.00,97778.00,'dp','2025-10-02 04:27:55',NULL,NULL,'proses','2025-09-25 04:27:55','2025-09-25 04:27:55',382308.00,'proses','Seeded order #25','selesai'),(30,'TRX-20250925-4349-CICI',35,'2025-09-25 04:27:55','normal',420081.00,0.00,'belum_lunas','2025-10-02 04:27:55',NULL,NULL,'pending','2025-09-25 04:27:55','2025-09-25 04:27:55',425522.00,'pending','Seeded order #26','pending'),(31,'TRX-20250925-6236-CICI',36,'2025-09-25 04:27:55','normal',218375.00,43675.00,'dp','2025-10-02 04:27:55',NULL,NULL,'proses','2025-09-25 04:27:55','2025-09-25 04:27:55',189490.00,'pending','Seeded order #27','selesai'),(32,'TRX-20250925-1693-CICI',37,'2025-09-25 04:27:55','normal',109834.00,20868.00,'dp','2025-10-02 04:27:55',NULL,NULL,'proses','2025-09-25 04:27:55','2025-09-25 04:27:55',95328.00,'pending','Seeded order #28','selesai'),(33,'TRX-20250925-5583-CICI',38,'2025-09-25 04:27:55','normal',1112910.00,222582.00,'dp','2025-10-02 04:27:55',NULL,NULL,'proses','2025-09-25 04:27:55','2025-09-25 04:27:55',1081682.00,'pending','Seeded order #29','selesai'),(34,'TRX-20250925-4026-CICI',39,'2025-09-25 04:27:55','normal',866839.00,866839.00,'lunas','2025-10-02 04:27:55',NULL,NULL,'selesai','2025-09-25 04:27:55','2025-09-25 04:27:55',857646.00,'pending','Seeded order #30','selesai'),(35,'TRX-20250925-6018-CICI',40,'2025-09-25 04:27:55','normal',180514.00,0.00,'belum_lunas','2025-10-02 04:27:55',NULL,NULL,'pending','2025-09-25 04:27:55','2025-09-25 04:27:55',160247.00,'pending','Seeded order #31','pending'),(36,'TRX-20250925-2996-CICI',41,'2025-09-25 04:27:55','normal',1040332.00,270486.00,'dp','2025-10-02 04:27:55',NULL,NULL,'proses','2025-09-25 04:27:55','2025-09-25 04:27:56',1011574.00,'pending','Seeded order #32','selesai'),(37,'TRX-20250925-5042-CICI',42,'2025-09-25 04:27:56','normal',435844.00,435844.00,'lunas','2025-10-02 04:27:56',NULL,NULL,'selesai','2025-09-25 04:27:56','2025-09-25 04:27:56',392329.00,'selesai','Seeded order #33','selesai'),(38,'TRX-20250925-2223-CICI',43,'2025-09-25 04:27:56','normal',456258.00,456258.00,'lunas','2025-10-02 04:27:56',NULL,NULL,'selesai','2025-09-25 04:27:56','2025-09-25 04:27:56',462557.00,'selesai','Seeded order #34','selesai'),(39,'TRX-20250925-3927-CICI',44,'2025-09-25 04:27:56','normal',649990.00,0.00,'belum_lunas','2025-10-02 04:27:56',NULL,NULL,'pending','2025-09-25 04:27:56','2025-09-25 04:27:56',608270.00,'pending','Seeded order #35','pending'),(40,'TRX-20250925-5992-CICI',45,'2025-09-25 04:27:56','normal',1273950.00,1273950.00,'lunas','2025-10-02 04:27:56',NULL,NULL,'selesai','2025-09-25 04:27:56','2025-09-25 04:27:56',1230083.00,'selesai','Seeded order #36','selesai'),(41,'TRX-20250925-4797-CICI',34,'2025-09-25 04:27:56','normal',1104767.00,1104767.00,'lunas','2025-10-02 04:27:56',NULL,NULL,'selesai','2025-09-25 04:27:56','2025-09-25 04:27:54',1097810.00,'pending','Seeded order #37','selesai'),(42,'TRX-20250925-9540-CICI',35,'2025-09-25 04:27:54','normal',1085294.00,1085294.00,'lunas','2025-10-02 04:27:54',NULL,NULL,'selesai','2025-09-25 04:27:54','2025-09-25 04:27:55',1099664.00,'selesai','Seeded order #38','selesai'),(43,'TRX-20250925-6424-CICI',36,'2025-09-25 04:27:55','normal',86106.00,86106.00,'lunas','2025-10-02 04:27:55',NULL,NULL,'selesai','2025-09-25 04:27:55','2025-09-25 04:27:55',101833.00,'pending','Seeded order #39','selesai'),(44,'TRX-20250925-3179-CICI',37,'2025-09-25 04:27:55','normal',604177.00,604177.00,'lunas','2025-10-02 04:27:55',NULL,NULL,'selesai','2025-09-25 04:27:55','2025-09-25 04:27:55',575437.00,'selesai','Seeded order #40','selesai'),(45,'TRX-20250925-001-CICI',46,'2025-09-25 07:32:00','normal',150000.00,0.00,'belum_lunas','2025-10-02 07:32:00',NULL,NULL,'pending','2025-09-25 07:32:00','2025-09-25 07:32:00',150000.00,'pending',NULL,'pending'),(46,'TRX-20250925-002-CICI',47,'2025-09-25 07:32:00','normal',300000.00,300000.00,'lunas','2025-10-02 07:32:00',NULL,NULL,'selesai','2025-09-25 07:32:00','2025-09-25 07:32:01',300000.00,'pending',NULL,'selesai'),(47,'TRX-20250925-003-CICI',48,'2025-09-25 07:32:01','normal',500000.00,50000.00,'dp','2025-10-02 07:32:01',NULL,NULL,'proses','2025-09-25 07:32:01','2025-09-25 07:32:01',500000.00,'pending',NULL,'selesai'),(48,'TRX-20250925-2254-1',49,'2025-09-25 07:41:27','normal',140024.00,0.00,'belum_lunas','2025-10-02 07:41:27',NULL,NULL,'pending','2025-09-25 07:41:27','2025-09-25 07:41:27',140024.00,'pending','Created by delay script #1','pending'),(49,'TRX-20250925-3286-2',50,'2025-09-25 07:41:32','normal',271816.00,0.00,'belum_lunas','2025-10-02 07:41:32',NULL,NULL,'pending','2025-09-25 07:41:32','2025-09-25 07:41:32',271816.00,'pending','Created by delay script #2','pending'),(50,'TRX-20250925-7880-3',51,'2025-09-25 07:41:37','normal',107386.00,0.00,'belum_lunas','2025-10-02 07:41:37',NULL,NULL,'pending','2025-09-25 07:41:37','2025-09-25 07:41:37',107386.00,'pending','Created by delay script #3','pending'),(51,'TRX-20250925-9943-2',52,'2025-09-25 07:47:04','normal',524823.00,0.00,'belum_lunas','2025-10-02 07:47:04',NULL,NULL,'pending','2025-09-25 07:47:04','2025-09-25 07:47:04',524823.00,'pending','Created by create_2_orders.js #1','pending'),(52,'TRX-20250925-5068-2',53,'2025-09-25 07:47:04','normal',122137.00,0.00,'belum_lunas','2025-10-02 07:47:04',NULL,NULL,'pending','2025-09-25 07:47:04','2025-09-25 07:47:04',122137.00,'pending','Created by create_2_orders.js #2','pending'),(53,'TRX-25092025-8384-CICI',1,'2025-09-25 07:48:36','normal',1200000.00,300000.00,'dp','2025-10-02 07:48:36','','https://drive.google.com/drive/folders/1Hc4xBtJGdi39vnve6P7Nb6Gr_YmuQ23w','proses',NULL,'2025-09-25 08:05:49',1200000.00,'pending','','selesai'),(54,'TRX-25092025-5067-CICI',1,'2025-09-25 11:36:19','normal',2500000.00,1000000.00,'dp','2025-10-02 11:36:19','','https://drive.google.com/drive/folders/1uRJuU8Se2cEXUda8ntXZXjGJNMgReuSI','proses',NULL,'2025-09-25 12:11:38',2500000.00,'selesai','','selesai'),(55,'TRX-25092025-1844-CICI',1,'2025-09-25 12:11:52','normal',2000000.00,1000000.00,'dp','2025-10-02 12:11:52','','https://drive.google.com/drive/folders/18Og0dHhh89NPAXAtn9qn5Jsho1i0Fqn2','proses',NULL,'2025-09-26 09:37:30',2000000.00,'pending','','selesai');
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
  CONSTRAINT `payments_ibfk_837` FOREIGN KEY (`no_transaksi`) REFERENCES `orders` (`no_transaksi`) ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_838` FOREIGN KEY (`no_hp`) REFERENCES `customers` (`no_hp`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,50000.00,'2025-09-24 16:43:16','https://drive.google.com/file/d/129DxflgHmg5n-2j_p_ktgWZCJDUgY00r/view?usp=drivesdk','dp','TRX-24092025-8752-CICI','6288806301215','verified'),(2,51800.00,'2025-09-24 16:43:18','https://drive.google.com/file/d/1tq5z3q8SAV6b8GT9fY7LvHayyo24X89W/view?usp=drivesdk','dp','TRX-24092025-6334-MAUL','6285946599064','verified'),(3,50000.00,'2025-09-24 16:58:21','https://drive.google.com/file/d/15pWbUaiXThHQ7SrCAOJMuLZ592-24gRk/view?usp=drivesdk','dp','TRX-24092025-8752-CICI','6288806301215','verified'),(4,1200000.00,'2025-09-24 17:07:46','https://drive.google.com/file/d/1lv6YDMeNCfhujazDGvGQwpHUbCOXkcuT/view?usp=drivesdk','dp','TRX-25092025-8029-CICI','6288806301215','verified'),(5,500000.00,'2025-09-24 17:14:26','https://drive.google.com/file/d/1J5NbK4I8XJ6zArNqpu5vnQjBQ-dMlPa5/view?usp=drivesdk','dp','TRX-25092025-3129-CICI','6288806301215','verified'),(6,369301.00,'2025-09-25 04:27:53','https://example.com/bukti/22da776d-5adb-4ba9-b342-bd88d6b97ad1.jpg','pelunasan','TRX-20250925-7818-CICI','628880631001','verified'),(7,0.00,'2025-09-25 04:27:53','https://example.com/bukti/690dda55-cd48-4493-91ed-68fb47eef415.jpg','dp','TRX-20250925-8704-CICI','628880631002','menunggu_verifikasi'),(8,0.00,'2025-09-25 04:27:53','https://example.com/bukti/837eb4cb-ec18-43f1-b12f-44c72c3636b7.jpg','dp','TRX-20250925-9655-CICI','628880631004','menunggu_verifikasi'),(9,0.00,'2025-09-25 04:27:53','https://example.com/bukti/2c7e2577-1c9d-4151-ac7d-def299e253e7.jpg','dp','TRX-20250925-1119-CICI','628880631005','menunggu_verifikasi'),(10,0.00,'2025-09-25 04:27:53','https://example.com/bukti/68c5b7b6-6421-454a-b0ed-f64c6425284f.jpg','dp','TRX-20250925-3096-CICI','628880631006','menunggu_verifikasi'),(11,977482.00,'2025-09-25 04:27:53','https://example.com/bukti/d51baf6c-b407-4775-aa44-7f1779fb1c55.jpg','pelunasan','TRX-20250925-2330-CICI','628880631007','verified'),(12,0.00,'2025-09-25 04:27:53','https://example.com/bukti/48cb27cb-715d-43f3-9a4c-7a68cd83e762.jpg','dp','TRX-20250925-2413-CICI','628880631008','menunggu_verifikasi'),(13,238475.00,'2025-09-25 04:27:54',NULL,'dp','TRX-20250925-2388-CICI','628880631009','pending'),(14,740570.00,'2025-09-25 04:27:54','https://example.com/bukti/9a16c369-1d9d-47f6-9729-222eae67a016.jpg','pelunasan','TRX-20250925-6364-CICI','628880631011','verified'),(15,489217.00,'2025-09-25 04:27:54','https://example.com/bukti/64d939c0-ec3a-4bff-a21e-8d55b3d6d6db.jpg','dp','TRX-20250925-8139-CICI','628880631000','verified'),(16,22228.00,'2025-09-25 04:27:54','https://example.com/bukti/a46807fc-9751-4598-9cc9-003c7214f663.jpg','dp','TRX-20250925-6496-CICI','628880631002','verified'),(17,0.00,'2025-09-25 04:27:54','https://example.com/bukti/418b4e43-ca36-4eba-b356-afdf461d2a37.jpg','dp','TRX-20250925-5585-CICI','628880631005','menunggu_verifikasi'),(18,336844.00,'2025-09-25 04:27:54','https://example.com/bukti/3e856a93-1cde-4d1f-be27-ac20a6ccaee7.jpg','dp','TRX-20250925-2551-CICI','628880631007','verified'),(19,1010533.00,'2025-09-25 04:27:54',NULL,'pelunasan','TRX-20250925-2551-CICI','628880631007','pending'),(20,0.00,'2025-09-25 04:27:54','https://example.com/bukti/04ee0fec-5b11-482f-bb40-50383cd87121.jpg','dp','TRX-20250925-6924-CICI','628880631008','menunggu_verifikasi'),(21,0.00,'2025-09-25 04:27:54','https://example.com/bukti/97b3af22-fc70-4d5d-be5f-edf61d8b38e1.jpg','dp','TRX-20250925-1535-CICI','628880631009','menunggu_verifikasi'),(22,1385785.00,'2025-09-25 04:27:54','https://example.com/bukti/e7f5dc0d-7254-4404-b4d9-ffcfaf95c975.jpg','pelunasan','TRX-20250925-8434-CICI','628880631010','verified'),(23,0.00,'2025-09-25 04:27:55','https://example.com/bukti/66c151e4-9296-4b78-8981-9a34dd6526ee.jpg','dp','TRX-20250925-9647-CICI','628880631011','menunggu_verifikasi'),(24,97778.00,'2025-09-25 04:27:55','https://example.com/bukti/f2cf66b2-0abc-42e6-b494-fb9e7e3aa2be.jpg','dp','TRX-20250925-4755-CICI','628880631000','verified'),(25,43675.00,'2025-09-25 04:27:55',NULL,'dp','TRX-20250925-6236-CICI','628880631002','pending'),(26,20868.00,'2025-09-25 04:27:55',NULL,'dp','TRX-20250925-1693-CICI','628880631003','pending'),(27,222582.00,'2025-09-25 04:27:55',NULL,'dp','TRX-20250925-5583-CICI','628880631004','menunggu_verifikasi'),(28,130026.00,'2025-09-25 04:27:55','https://example.com/bukti/a83b96cf-81c6-4a59-bae1-81b3fb561f1a.jpg','dp','TRX-20250925-4026-CICI','628880631005','verified'),(29,736813.00,'2025-09-25 04:27:55',NULL,'pelunasan','TRX-20250925-4026-CICI','628880631005','pending'),(30,270486.00,'2025-09-25 04:27:55','https://example.com/bukti/12843e91-903c-4f58-ab1a-1f94f2c02b10.jpg','dp','TRX-20250925-2996-CICI','628880631007','verified'),(31,435844.00,'2025-09-25 04:27:56','https://example.com/bukti/d85885a7-1955-40c2-ae31-3f920b8294af.jpg','pelunasan','TRX-20250925-5042-CICI','628880631008','verified'),(32,456258.00,'2025-09-25 04:27:56','https://example.com/bukti/bd989bc3-62be-4580-b870-34d4944d6b7f.jpg','pelunasan','TRX-20250925-2223-CICI','628880631009','verified'),(33,382185.00,'2025-09-25 04:27:56','https://example.com/bukti/681d7a87-24d5-472d-8227-4ebfea36134d.jpg','dp','TRX-20250925-5992-CICI','628880631011','verified'),(34,891765.00,'2025-09-25 04:27:56',NULL,'pelunasan','TRX-20250925-5992-CICI','628880631011','pending'),(35,187810.00,'2025-09-25 04:27:56','https://example.com/bukti/64019dc7-d797-4ae9-918a-b1f60b145aba.jpg','dp','TRX-20250925-4797-CICI','628880631000','verified'),(36,916957.00,'2025-09-25 04:27:56',NULL,'pelunasan','TRX-20250925-4797-CICI','628880631000','pending'),(37,227912.00,'2025-09-25 04:27:54','https://example.com/bukti/fa63cd7a-a1b5-4b33-9274-8427c269f299.jpg','dp','TRX-20250925-9540-CICI','628880631001','verified'),(38,857382.00,'2025-09-25 04:27:55',NULL,'pelunasan','TRX-20250925-9540-CICI','628880631001','pending'),(39,86106.00,'2025-09-25 04:27:55','https://example.com/bukti/1ee233ab-66db-4952-98c4-e5af232ca97e.jpg','pelunasan','TRX-20250925-6424-CICI','628880631002','verified'),(40,604177.00,'2025-09-25 04:27:55','https://example.com/bukti/5f0a7fab-07ad-4d12-aadf-be1c92517d36.jpg','pelunasan','TRX-20250925-3179-CICI','628880631003','verified'),(41,300000.00,'2025-09-25 07:32:00','https://example.com/bukti/b02bc8a8-9ebb-4ea2-8d56-a7b7eb7b49bd.jpg','pelunasan','TRX-20250925-002-CICI','628880631201','verified'),(42,50000.00,'2025-09-25 07:32:01','https://example.com/bukti/2010f5e4-9b06-40d9-9a0d-42dbe3ed70cd.jpg','dp','TRX-20250925-003-CICI','628880631202','menunggu_verifikasi'),(43,300000.00,'2025-09-25 07:51:44','https://drive.google.com/file/d/1bxVMYiLOGO-o7EQiytifNalp7DzDLP5N/view?usp=drivesdk','dp','TRX-25092025-8384-CICI','6288806301215','verified'),(44,1000000.00,'2025-09-25 12:10:52','https://drive.google.com/file/d/1QTI6cDD5swbm-92HeKRObT1f927O0EXG/view?usp=drivesdk','dp','TRX-25092025-5067-CICI','6288806301215','verified'),(45,1000000.00,'2025-09-26 08:37:54','https://drive.google.com/file/d/1IzHPoYjDEh8OBX1p55gS1KovJidMH6JH/view?usp=drivesdk','dp','TRX-25092025-1844-CICI','6288806301215','verified');
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
  CONSTRAINT `piutang_ibfk_441` FOREIGN KEY (`id_customer`) REFERENCES `customers` (`id_customer`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `piutang_ibfk_442` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `piutang`
--

LOCK TABLES `piutang` WRITE;
/*!40000 ALTER TABLE `piutang` DISABLE KEYS */;
INSERT INTO `piutang` VALUES (2,34,139433.00,'2025-09-25 04:27:53','lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:54',139433.00,NULL),(3,36,53053.00,'2025-09-25 04:27:53','lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:55',53053.00,NULL),(4,38,191349.00,'2025-09-25 04:27:53','lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:55',191349.00,NULL),(5,39,666885.00,'2025-09-25 04:27:53','lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:55',666885.00,NULL),(6,40,118315.00,'2025-09-25 04:27:53','belum_lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:53',0.00,NULL),(7,42,186842.00,'2025-09-25 04:27:53','lunas',NULL,'2025-09-25 04:27:53','2025-09-25 04:27:56',186842.00,NULL),(8,43,389091.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:56',389091.00,NULL),(9,44,39495.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:55',39495.00,NULL),(10,34,187072.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:54',187072.00,NULL),(11,36,33006.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:55',33006.00,NULL),(12,39,179241.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:55',179241.00,NULL),(13,42,141423.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:56',141423.00,NULL),(14,43,157538.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:56',157538.00,NULL),(15,44,188385.00,'2025-09-25 04:27:54','lunas',NULL,'2025-09-25 04:27:54','2025-09-25 04:27:55',188385.00,NULL),(16,45,322129.00,'2025-09-25 04:27:55','lunas',NULL,'2025-09-25 04:27:55','2025-09-25 04:27:55',322129.00,NULL),(17,35,43546.00,'2025-09-25 04:27:55','lunas',NULL,'2025-09-25 04:27:55','2025-09-25 04:27:55',43546.00,NULL),(18,37,1677244.00,'2025-09-25 04:27:55','belum_lunas',NULL,'2025-09-25 04:27:55','2025-09-25 04:27:56',625045.00,NULL),(19,39,40867.00,'2025-09-25 04:27:55','belum_lunas',NULL,'2025-09-25 04:27:55','2025-09-25 04:27:55',20713.00,NULL),(20,40,117647.00,'2025-09-25 04:27:55','belum_lunas',NULL,'2025-09-25 04:27:55','2025-09-25 04:27:55',13848.00,NULL),(21,41,769846.00,'2025-09-25 04:27:56','lunas',NULL,'2025-09-25 04:27:56','2025-09-25 04:27:56',769846.00,NULL),(22,44,170933.00,'2025-09-25 04:27:56','belum_lunas',NULL,'2025-09-25 04:27:56','2025-09-25 04:27:56',0.00,NULL),(23,45,100307.00,'2025-09-25 04:27:56','lunas',NULL,'2025-09-25 04:27:56','2025-09-25 04:27:56',100307.00,NULL),(24,48,450000.00,'2025-09-25 07:32:01','belum_lunas',NULL,'2025-09-25 07:32:01','2025-09-25 07:32:01',50000.00,NULL),(25,1,3100000.00,'2025-09-25 12:11:38','lunas',NULL,'2025-09-25 12:11:38','2025-09-25 12:11:38',3100000.00,NULL);
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

-- Dump completed on 2025-09-26 16:39:01
