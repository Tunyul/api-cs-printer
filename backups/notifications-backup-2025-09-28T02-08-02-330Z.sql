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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'role','admin','Order created','{\"id_order\":1,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"id_customer\":1,\"total_bayar\":0,\"status_bot\":\"pending\",\"timestamp\":\"2025-09-26T10:18:47.166Z\"}','{\"id_order\": 1, \"timestamp\": \"2025-09-26T10:18:47.166Z\", \"status_bot\": \"pending\", \"id_customer\": 1, \"total_bayar\": 0, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:18:47','2025-09-26 10:59:43'),(2,'role','admin','payment created','{\"id_payment\":1,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-26T10:20:23.106Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-26T10:20:23.106Z\", \"id_payment\": 1, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:20:23','2025-09-26 10:59:43'),(3,'role','admin','Payment payment.updated','{\"id_payment\":1,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"nominal\":250000,\"status\":\"verified\",\"timestamp\":\"2025-09-26T10:20:42.396Z\"}','{\"status\": \"verified\", \"nominal\": 250000, \"timestamp\": \"2025-09-26T10:20:42.396Z\", \"id_payment\": 1, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:20:42','2025-09-26 10:59:43'),(4,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-26092025-7992-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-26T10:20:43.610Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-26T10:20:43.610Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-26092025-7992-CICI.pdf\", \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:20:43','2025-09-26 10:59:43'),(5,'role','admin','payment created','{\"id_payment\":2,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-26T10:23:40.915Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-26T10:23:40.915Z\", \"id_payment\": 2, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:23:40','2025-09-26 10:59:43'),(6,'role','admin','Payment payment.updated','{\"id_payment\":2,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"nominal\":350000,\"status\":\"verified\",\"timestamp\":\"2025-09-26T10:23:57.512Z\"}','{\"status\": \"verified\", \"nominal\": 350000, \"timestamp\": \"2025-09-26T10:23:57.512Z\", \"id_payment\": 2, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:23:57','2025-09-26 10:59:43'),(7,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-26092025-7992-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-26T10:23:58.592Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-26T10:23:58.592Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-26092025-7992-CICI.pdf\", \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:23:58','2025-09-26 10:59:43'),(8,'role','admin','Order updated','{\"id_order\":1,\"no_transaksi\":\"TRX-26092025-7992-CICI\",\"id_customer\":1,\"total_bayar\":600000,\"timestamp\":\"2025-09-26T10:24:21.394Z\"}','{\"id_order\": 1, \"timestamp\": \"2025-09-26T10:24:21.394Z\", \"id_customer\": 1, \"total_bayar\": 600000, \"no_transaksi\": \"TRX-26092025-7992-CICI\"}',1,'2025-09-26 10:24:21','2025-09-26 10:59:43'),(9,'role','admin','Customer looked up by bot','{\"id_customer\":32,\"nama\":\"testnotiftiga\",\"no_hp\":\"623333333333\",\"timestamp\":\"2025-09-27T04:13:14.377Z\"}','{\"nama\": \"testnotiftiga\", \"no_hp\": \"623333333333\", \"timestamp\": \"2025-09-27T04:13:14.377Z\", \"id_customer\": 32}',0,'2025-09-27 04:13:14','2025-09-27 04:13:14'),(10,'role','admin','Order created','{\"id_order\":189,\"no_transaksi\":\"TRX-27092025-8923-TESTNOTIFTIGA\",\"id_customer\":32,\"total_bayar\":0,\"status_bot\":\"pending\",\"timestamp\":\"2025-09-27T04:13:14.951Z\"}','{\"id_order\": 189, \"timestamp\": \"2025-09-27T04:13:14.951Z\", \"status_bot\": \"pending\", \"id_customer\": 32, \"total_bayar\": 0, \"no_transaksi\": \"TRX-27092025-8923-TESTNOTIFTIGA\"}',0,'2025-09-27 04:13:14','2025-09-27 04:13:14'),(11,'role','admin','payment created','{\"id_payment\":126,\"no_transaksi\":\"TRX-27092025-8923-TESTNOTIFTIGA\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-27T04:13:21.119Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-27T04:13:21.119Z\", \"id_payment\": 126, \"no_transaksi\": \"TRX-27092025-8923-TESTNOTIFTIGA\"}',0,'2025-09-27 04:13:21','2025-09-27 04:13:21'),(12,'role','admin','payment created','{\"id_payment\":127,\"no_transaksi\":\"TRX-20250926-9314-CICI\",\"nominal\":0,\"status\":\"menunggu_verifikasi\",\"timestamp\":\"2025-09-27T06:21:33.669Z\"}','{\"status\": \"menunggu_verifikasi\", \"nominal\": 0, \"timestamp\": \"2025-09-27T06:21:33.669Z\", \"id_payment\": 127, \"no_transaksi\": \"TRX-20250926-9314-CICI\"}',0,'2025-09-27 06:21:33','2025-09-27 06:21:33'),(13,'role','admin','Payment payment.updated','{\"id_payment\":127,\"no_transaksi\":\"TRX-20250926-9314-CICI\",\"nominal\":300000,\"status\":\"verified\",\"timestamp\":\"2025-09-27T06:29:35.871Z\"}','{\"status\": \"verified\", \"nominal\": 300000, \"timestamp\": \"2025-09-27T06:29:35.871Z\", \"id_payment\": 127, \"no_transaksi\": \"TRX-20250926-9314-CICI\"}',0,'2025-09-27 06:29:35','2025-09-27 06:29:35'),(14,'role','admin','Invoice sent','{\"no_transaksi\":\"TRX-20250926-9314-CICI\",\"invoice_url\":\"http://localhost:3000/invoice/TRX-20250926-9314-CICI.pdf\",\"status\":\"sent\",\"timestamp\":\"2025-09-27T06:29:37.185Z\"}','{\"status\": \"sent\", \"timestamp\": \"2025-09-27T06:29:37.185Z\", \"invoice_url\": \"http://localhost:3000/invoice/TRX-20250926-9314-CICI.pdf\", \"no_transaksi\": \"TRX-20250926-9314-CICI\"}',0,'2025-09-27 06:29:37','2025-09-27 06:29:37');
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

-- Dump completed on 2025-09-28  9:08:02
