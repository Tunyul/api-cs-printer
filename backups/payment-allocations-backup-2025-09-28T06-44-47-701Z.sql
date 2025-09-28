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
-- Table structure for table `payment_allocations`
--

DROP TABLE IF EXISTS `payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_allocations` (
  `id_alloc` bigint NOT NULL AUTO_INCREMENT,
  `id_payment` int NOT NULL,
  `id_piutang` int NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tanggal_alloc` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alloc`),
  KEY `id_payment` (`id_payment`),
  KEY `id_piutang` (`id_piutang`),
  CONSTRAINT `payment_allocations_ibfk_10` FOREIGN KEY (`id_piutang`) REFERENCES `piutang` (`id_piutang`) ON UPDATE CASCADE,
  CONSTRAINT `payment_allocations_ibfk_9` FOREIGN KEY (`id_payment`) REFERENCES `payments` (`id_payment`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_allocations`
--

LOCK TABLES `payment_allocations` WRITE;
/*!40000 ALTER TABLE `payment_allocations` DISABLE KEYS */;
INSERT INTO `payment_allocations` VALUES (1,1,1,20000.00,'2025-09-28 03:35:27',NULL,'2025-09-28 03:35:27','2025-09-28 03:35:27'),(2,2,1,10000.00,'2025-09-28 03:36:16',NULL,'2025-09-28 03:36:16','2025-09-28 03:36:16'),(3,5,2,9100000.00,'2025-09-28 04:13:07',NULL,'2025-09-28 04:13:07','2025-09-28 04:13:07'),(4,7,3,1800000.00,'2025-09-28 04:31:11',NULL,'2025-09-28 04:31:11','2025-09-28 04:31:11'),(5,9,4,2000000.00,'2025-09-28 04:49:04',NULL,'2025-09-28 04:49:04','2025-09-28 04:49:04');
/*!40000 ALTER TABLE `payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-28 13:44:47
