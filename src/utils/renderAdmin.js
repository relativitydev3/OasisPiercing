function renderAdmin(res, view, options = {}) {
  return new Promise((resolve, reject) => {
    res.render(view, options, (err, body) => {
      if (err) return reject(err);

      res.render('layouts/admin', { ...options, body }, (layoutErr, html) => {
        if (layoutErr) return reject(layoutErr);
        res.send(html);
        resolve();
      });
    });
  });
}

module.exports = { renderAdmin };
