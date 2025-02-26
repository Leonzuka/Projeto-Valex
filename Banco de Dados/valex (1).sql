-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: roundhouse.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `atividade`
--

DROP TABLE IF EXISTS `atividade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atividade` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produtor_id` int NOT NULL,
  `fazenda_id` int NOT NULL,
  `variedade_id` int NOT NULL,
  `tipo_atividade` varchar(20) NOT NULL,
  `quantidade_pallets` int NOT NULL,
  `caixas` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `classificacao_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produtor_id` (`produtor_id`),
  KEY `fazenda_id` (`fazenda_id`),
  KEY `variedade_id` (`variedade_id`),
  KEY `fk_atividade_classificacao` (`classificacao_id`),
  KEY `idx_atividade_produtor_id` (`produtor_id`),
  KEY `idx_atividade_created_at` (`created_at`),
  CONSTRAINT `atividade_ibfk_2` FOREIGN KEY (`fazenda_id`) REFERENCES `fazenda` (`id`),
  CONSTRAINT `atividade_ibfk_3` FOREIGN KEY (`variedade_id`) REFERENCES `variedade` (`id`),
  CONSTRAINT `atividade_produtor_fk` FOREIGN KEY (`produtor_id`) REFERENCES `produtor` (`id`),
  CONSTRAINT `fk_atividade_classificacao` FOREIGN KEY (`classificacao_id`) REFERENCES `classificacao_uva` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `balancete_items`
--

DROP TABLE IF EXISTS `balancete_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `balancete_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conta` varchar(20) DEFAULT NULL,
  `reducao` int DEFAULT NULL,
  `tipo` varchar(1) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_anterior` decimal(15,2) DEFAULT NULL,
  `valor_periodo_debito` decimal(15,2) DEFAULT NULL,
  `valor_periodo_credito` decimal(15,2) DEFAULT NULL,
  `valor_atual` decimal(15,2) DEFAULT NULL,
  `data_importacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9540 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classificacao_uva`
--

DROP TABLE IF EXISTS `classificacao_uva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classificacao_uva` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classificacao` varchar(50) NOT NULL,
  `caixa` varchar(50) NOT NULL,
  `cinta` varchar(50) DEFAULT NULL,
  `peso` varchar(10) NOT NULL,
  `cumbuca` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracoes_relatorios`
--

DROP TABLE IF EXISTS `configuracoes_relatorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracoes_relatorios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_relatorio` varchar(100) NOT NULL,
  `tipo_relatorio` varchar(50) DEFAULT NULL,
  `configuracao` json DEFAULT NULL COMMENT 'Configurações específicas do relatório em formato JSON',
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fazenda`
--

DROP TABLE IF EXISTS `fazenda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fazenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `area_parcela` varchar(20) NOT NULL,
  `produtor_id` int NOT NULL,
  `variedade_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `area_total` float DEFAULT NULL COMMENT 'Área total da fazenda em hectares',
  PRIMARY KEY (`id`),
  KEY `produtor_id` (`produtor_id`),
  KEY `variedade_id` (`variedade_id`),
  KEY `idx_fazenda_area_parcela` (`area_parcela`),
  CONSTRAINT `fazenda_ibfk_2` FOREIGN KEY (`variedade_id`) REFERENCES `variedade` (`id`),
  CONSTRAINT `fazenda_produtor_fk` FOREIGN KEY (`produtor_id`) REFERENCES `produtor` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=631 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fluxo_caixa`
--

DROP TABLE IF EXISTS `fluxo_caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fluxo_caixa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `periodo_id` int NOT NULL,
  `data_movimento` date NOT NULL,
  `tipo_movimento` enum('OPERACIONAL','INVESTIMENTO','FINANCIAMENTO') DEFAULT NULL,
  `descricao` varchar(200) DEFAULT NULL,
  `valor` decimal(15,2) DEFAULT NULL,
  `natureza` enum('ENTRADA','SAIDA') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `periodo_id` (`periodo_id`),
  CONSTRAINT `fluxo_caixa_ibfk_1` FOREIGN KEY (`periodo_id`) REFERENCES `periodos_contabeis` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historico_precos`
--

DROP TABLE IF EXISTS `historico_precos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_precos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variedade_id` int NOT NULL,
  `preco_kg` decimal(10,2) NOT NULL,
  `data_vigencia` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `variedade_id` (`variedade_id`),
  CONSTRAINT `historico_precos_ibfk_1` FOREIGN KEY (`variedade_id`) REFERENCES `variedade` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `indicadores_financeiros`
--

DROP TABLE IF EXISTS `indicadores_financeiros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `indicadores_financeiros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `periodo_id` int NOT NULL,
  `tipo_indicador` varchar(50) NOT NULL,
  `nome_indicador` varchar(100) NOT NULL,
  `valor` decimal(15,4) DEFAULT NULL,
  `formula` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `periodo_id` (`periodo_id`),
  CONSTRAINT `indicadores_financeiros_ibfk_1` FOREIGN KEY (`periodo_id`) REFERENCES `periodos_contabeis` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inspecoes`
--

DROP TABLE IF EXISTS `inspecoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspecoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lote_id` int NOT NULL,
  `tipo_inspecao` enum('pre_colheita','pos_colheita','embalagem') NOT NULL,
  `resultado` enum('aprovado','reprovado','pendente') NOT NULL,
  `observacoes` text,
  `inspetor_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lote_id` (`lote_id`),
  KEY `inspetor_id` (`inspetor_id`),
  CONSTRAINT `inspecoes_ibfk_1` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`),
  CONSTRAINT `inspecoes_ibfk_2` FOREIGN KEY (`inspetor_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lotes`
--

DROP TABLE IF EXISTS `lotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `atividade_id` int NOT NULL,
  `data_colheita` date DEFAULT NULL,
  `data_embalagem` date DEFAULT NULL,
  `data_transporte` date DEFAULT NULL,
  `observacoes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `atividade_id` (`atividade_id`),
  CONSTRAINT `lotes_ibfk_1` FOREIGN KEY (`atividade_id`) REFERENCES `atividade` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `periodos_contabeis`
--

DROP TABLE IF EXISTS `periodos_contabeis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodos_contabeis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ano` int NOT NULL,
  `mes` int NOT NULL,
  `status` enum('ABERTO','FECHADO','EM_PROCESSAMENTO') DEFAULT 'ABERTO',
  `data_abertura` timestamp NULL DEFAULT NULL,
  `data_fechamento` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ano_mes` (`ano`,`mes`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plano_contas`
--

DROP TABLE IF EXISTS `plano_contas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plano_contas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sequencial` varchar(20) DEFAULT NULL,
  `codigo` varchar(20) NOT NULL,
  `codigo_reduzido` varchar(20) DEFAULT NULL,
  `descricao` varchar(200) NOT NULL,
  `nivel` int DEFAULT NULL,
  `conta_pai_id` int DEFAULT NULL,
  `tipo_conta` enum('ATIVO','PASSIVO','RECEITA','DESPESA','PATRIMONIO_LIQUIDO') DEFAULT NULL,
  `natureza_saldo` enum('DEVEDOR','CREDOR') DEFAULT NULL,
  `permite_lancamento` tinyint(1) DEFAULT '1',
  `tipo` varchar(5) DEFAULT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_conta_pai` (`conta_pai_id`),
  KEY `idx_plano_contas_codigo` (`codigo`),
  CONSTRAINT `fk_conta_pai` FOREIGN KEY (`conta_pai_id`) REFERENCES `plano_contas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1458 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `produtor`
--

DROP TABLE IF EXISTS `produtor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `ggn` varchar(13) DEFAULT NULL,
  `sigla` varchar(5) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `telefone` varchar(20) DEFAULT NULL COMMENT 'Número de telefone do produtor',
  `endereco` varchar(255) DEFAULT NULL COMMENT 'Endereço completo do produtor',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_produtor_ggn` (`ggn`),
  KEY `idx_produtor_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('gestor','cooperado') NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `produtor_id` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `ultimo_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `produtor_id` (`produtor_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`produtor_id`) REFERENCES `produtor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `variedade`
--

DROP TABLE IF EXISTS `variedade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variedade` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_variedade_nome` (`nome`),
  KEY `idx_variedade_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-25 21:03:16
