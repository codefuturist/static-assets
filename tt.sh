curl -sfL https://get.k3s.io | sh -s - server \
--cluster-init \
--etcd-s3 \
--etcd-s3-endpoint=192.168.2.30:9000 \
--etcd-s3-bucket=k3s-etcd-backup \
--etcd-s3-access-key=fh8Kd4aaXFg6ZR4ZakX5 \
--etcd-s3-secret-key=ZEnsvLi6sU9vzfr5qbsNL38gB7UoaXoWSA3d7zxn \
--etcd-snapshot-schedule-cron="*/15 * * * *" \
--etcd-snapshot-retention=5

--etcd-s3-folder=<FOLDER_NAME> \

git remote add origi git@github.com:codefuturist/static-assets.git
git branch -M main
git push -u origi main

git lfs track "*.png"
git lfs track "*.jpg"
git lfs track "*.jpeg"
git lfs track "*.gif"
git lfs track "*.svg"
git lfs track "*.woff"
git lfs track "*.woff2"
git lfs track "*.ttf"
git lfs track "*.otf"
git lfs track "*.mp3"
git lfs track "*.mp4"
git lfs track "*.webm"
git lfs track "*.zip"
git lfs track "*.tar.gz"