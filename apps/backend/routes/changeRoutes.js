router.get('/:changeId/deployment-status', (req, res) => {
    getDeploymentStatusByChangeId(
      req.params.changeId,
      (err, result) => {
        if (err) {
          return res.status(404).json({
            message: err.message,
          });
        }
  
        res.json(result);
      }
    );
  });