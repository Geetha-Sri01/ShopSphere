This directory is reserved for Aiven Apache Kafka SSL certificates.

When you create your Apache Kafka service in the Aiven Console:
1. Navigate to your Kafka service overview page.
2. In the "Connection information" section, download the 3 certificate files:
   - ca.pem (CA Certificate)
   - service.cert (Access Certificate)
   - service.key (Access Key)
3. Place all 3 files right here in this backend/certs/ folder.

Note:
These files contain private cryptographic keys and are automatically ignored by .gitignore to prevent them from ever being committed to Git.
