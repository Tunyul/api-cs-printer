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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('user','role') NOT NULL,
  `recipient_id` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `body` text,
  `data` json DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notification`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'role','admin','Order created','{\"id_order\":1,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"id_customer\":1,\"total_bayar\":0,\"status_bot\":\"pending\",\"timestamp\":\"2025-09-28T02:08:33.541Z\"}','{\"id_order\": 1, \"timestamp\": \"2025-09-28T02:08:33.541Z\", \"status_bot\": \"pending\", \"id_customer\": 1, \"total_bayar\": 0, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:08:33','2025-09-28 02:08:33'),(2,'role','admin','payment created','{\"id_payment\":1,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-28T02:23:09.022Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-28T02:23:09.022Z\", \"id_payment\": 1, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:23:09','2025-09-28 02:23:09'),(3,'role','admin','Payment payment.updated','{\"id_payment\":1,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":2000000,\"status\":\"verified\",\"timestamp\":\"2025-09-28T02:23:35.844Z\"}','{\"status\": \"verified\", \"nominal\": 2000000, \"timestamp\": \"2025-09-28T02:23:35.844Z\", \"id_payment\": 1, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:23:35','2025-09-28 02:23:35'),(4,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-28T02:23:37.341Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-28T02:23:37.341Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\", \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:23:37','2025-09-28 02:23:37'),(5,'role','admin','payment created','{\"id_payment\":2,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-28T02:28:38.244Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-28T02:28:38.244Z\", \"id_payment\": 2, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:28:38','2025-09-28 02:28:38'),(6,'role','admin','Payment payment.updated','{\"id_payment\":2,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":300000,\"status\":\"verified\",\"timestamp\":\"2025-09-28T02:28:53.339Z\"}','{\"status\": \"verified\", \"nominal\": 300000, \"timestamp\": \"2025-09-28T02:28:53.339Z\", \"id_payment\": 2, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:28:53','2025-09-28 02:28:53'),(7,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-28T02:28:54.600Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-28T02:28:54.600Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\", \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:28:54','2025-09-28 02:28:54'),(8,'role','admin','payment created','{\"id_payment\":3,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-28T02:44:40.376Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-28T02:44:40.376Z\", \"id_payment\": 3, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:44:40','2025-09-28 02:44:40'),(9,'role','admin','Payment payment.updated','{\"id_payment\":3,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":500000,\"status\":\"verified\",\"timestamp\":\"2025-09-28T02:45:28.352Z\"}','{\"status\": \"verified\", \"nominal\": 500000, \"timestamp\": \"2025-09-28T02:45:28.352Z\", \"id_payment\": 3, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:45:28','2025-09-28 02:45:28'),(10,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-28T02:45:30.278Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-28T02:45:30.278Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\", \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:45:30','2025-09-28 02:45:30'),(11,'role','admin','payment created','{\"id_payment\":4,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-28T02:46:03.828Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-28T02:46:03.828Z\", \"id_payment\": 4, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:46:03','2025-09-28 02:46:03'),(12,'role','admin','Payment payment.updated','{\"id_payment\":4,\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"nominal\":300000,\"status\":\"verified\",\"timestamp\":\"2025-09-28T02:50:46.672Z\"}','{\"status\": \"verified\", \"nominal\": 300000, \"timestamp\": \"2025-09-28T02:50:46.672Z\", \"id_payment\": 4, \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:50:46','2025-09-28 02:50:46'),(13,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-28092025-6597-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-28T02:50:48.560Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-28T02:50:48.560Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-28092025-6597-CICI.pdf\", \"no_transaksi\": \"TRX-28092025-6597-CICI\"}',0,'2025-09-28 02:50:48','2025-09-28 02:50:48');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-28 10:19:22
